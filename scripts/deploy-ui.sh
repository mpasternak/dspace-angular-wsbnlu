#!/usr/bin/env bash
# deploy-ui.sh — build the Angular UI locally and deploy it to a server running it under pm2.
#
# Flow: build (local) -> rsync dist/ to a staging dir in the remote user's home ->
#       (as root on the server) copy to <DIR>/dist.new, swap dist <-> dist.prev, pm2 reload ->
#       verify CHECK_URL (optionally grep its HTML) -> automatic rollback if verification fails.
#
# Nothing installation-specific lives in this file. Configure via environment variables or a
# git-ignored `.deploy-ui.env` in the repository root (see `.deploy-ui.env.example`):
#
#   DEPLOY_HOST      (required) ssh destination (ideally an alias from ~/.ssh/config)
#   DEPLOY_DIR       remote UI directory containing config/ and dist/   [/opt/dspace-angular]
#   DEPLOY_PM2_APP   (required) pm2 app name to reload
#   DEPLOY_SSH       command used to reach the host for the root part    [ssh]
#                    e.g. a wrapper that forwards a sudo-only agent key
#   DEPLOY_RSYNC_SSH ssh command used by rsync for the upload             [ssh]
#   DEPLOY_STAGE     staging dir, relative to the remote user's home      [deploy-ui-dist]
#   CHECK_URL        page fetched after reload (an item page is ideal)    [none = skip check]
#   CHECK_GREP       extended regex that must appear in CHECK_URL's HTML  [none]
#   CHECK_TIMEOUT    seconds to wait for CHECK_URL to pass                [120]
#
# Options:
#   --no-build   deploy the existing dist/ without rebuilding
#   --ci         run `npm ci` before building
#   --dry-run    print what would be done, change nothing
#   -h, --help   show this help
#
# Rollback by hand (on the server):  cd $DEPLOY_DIR && mv dist dist.bad && mv dist.prev dist
#                                    && pm2 reload $DEPLOY_PM2_APP
set -euo pipefail

die() { echo "deploy-ui: ERROR: $*" >&2; exit 1; }
info() { echo "deploy-ui: $*" >&2; }

usage() { sed -n '2,/^set -euo/{/^set -euo/d;s/^# \{0,1\}//;p}' "$0"; exit "${1:-0}"; }

BUILD=1; NPM_CI=0; DRY_RUN=0
while [ $# -gt 0 ]; do
  case "$1" in
    --no-build) BUILD=0 ;;
    --ci) NPM_CI=1 ;;
    --dry-run) DRY_RUN=1 ;;
    -h|--help) usage 0 ;;
    *) echo "deploy-ui: unknown option: $1" >&2; usage 2 ;;
  esac
  shift
done

REPO_DIR=$(cd "$(dirname "$0")/.." && pwd)
cd "$REPO_DIR"

if [ -f .deploy-ui.env ]; then
  # shellcheck disable=SC1091  # optional, git-ignored, operator-provided
  . ./.deploy-ui.env
fi

: "${DEPLOY_HOST:?set DEPLOY_HOST (env or .deploy-ui.env)}"
: "${DEPLOY_PM2_APP:?set DEPLOY_PM2_APP (env or .deploy-ui.env)}"
DEPLOY_DIR=${DEPLOY_DIR:-/opt/dspace-angular}
DEPLOY_SSH=${DEPLOY_SSH:-ssh}
DEPLOY_RSYNC_SSH=${DEPLOY_RSYNC_SSH:-ssh}
DEPLOY_STAGE=${DEPLOY_STAGE:-deploy-ui-dist}
CHECK_URL=${CHECK_URL:-}
CHECK_GREP=${CHECK_GREP:-}
CHECK_TIMEOUT=${CHECK_TIMEOUT:-120}

case "$DEPLOY_DIR" in
  /?*) ;;
  *) die "DEPLOY_DIR must be an absolute path, got: $DEPLOY_DIR" ;;
esac
case "$DEPLOY_STAGE" in
  ''|/*|*..*) die "DEPLOY_STAGE must be a relative path inside the remote home, got: $DEPLOY_STAGE" ;;
esac

run() {
  if [ "$DRY_RUN" = 1 ]; then
    printf 'deploy-ui: [dry-run]'; printf ' %q' "$@"; printf '\n'
  else
    "$@"
  fi
}

# Run a bash script as root on the server. The script travels base64-encoded so no quoting
# survives two shells; variables are passed as an env prefix. stdin is /dev/null so sudo can
# never block on a prompt.
remote_root() {
  local script=$1; shift
  local env_prefix="" kv
  for kv in "$@"; do env_prefix+="$(printf '%q ' "$kv")"; done
  local b64
  b64=$(printf '%s' "$script" | base64 | tr -d '\n')
  # shellcheck disable=SC2086  # DEPLOY_SSH may carry options; word splitting is intended
  run $DEPLOY_SSH "$DEPLOY_HOST" -T \
    "sudo -k; sudo env ${env_prefix}bash -c \"\$(echo $b64 | base64 -d)\" </dev/null"
}

COMMIT=$(git rev-parse --short HEAD)
if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
  info "WARNING: working tree has uncommitted changes; the build will not match commit $COMMIT"
  COMMIT="$COMMIT-dirty"
fi

# --- 1. Node major version must match the server's --------------------------------------
LOCAL_NODE=$(node --version)
if [ "$DRY_RUN" = 0 ]; then
  REMOTE_NODE=$(remote_root 'node --version' | tail -1)
  [ "${LOCAL_NODE%%.*}" = "${REMOTE_NODE%%.*}" ] \
    || die "Node major differs: local $LOCAL_NODE, server $REMOTE_NODE"
  info "Node: local $LOCAL_NODE, server $REMOTE_NODE"
fi

# --- 2. Build --------------------------------------------------------------------------
if [ "$BUILD" = 1 ]; then
  [ "$NPM_CI" = 1 ] && run npm ci
  run npm run build:prod
fi
# The server bundle is emitted with a content hash (main.<hash>.js) while pm2 starts
# dist/server/main.js, so point a relative symlink at the freshly built bundle.
if [ "$DRY_RUN" = 0 ] && [ -d dist/server ]; then
  mapfile -t BUNDLES < <(find dist/server -maxdepth 1 -type f -name 'main.*.js')
  if [ "${#BUNDLES[@]}" = 1 ]; then
    ln -sfn "$(basename "${BUNDLES[0]}")" dist/server/main.js
  elif [ "${#BUNDLES[@]}" -gt 1 ]; then
    die "several dist/server/main.*.js bundles found — clean dist/ and rebuild"
  fi
fi
[ "$DRY_RUN" = 1 ] || [ -f dist/server/main.js ] || die "dist/server/main.js missing — build first"
if [ "$DRY_RUN" = 0 ]; then
  printf 'commit=%s\nbuilt=%s\nnode=%s\n' "$COMMIT" "$(date -Iseconds)" "$LOCAL_NODE" > dist/DEPLOYED_FROM
fi

# --- 3. Upload to the staging dir (no root needed) ---------------------------------------
info "uploading dist/ ($COMMIT) to $DEPLOY_HOST:~/$DEPLOY_STAGE/"
run rsync -az --delete -e "$DEPLOY_RSYNC_SSH" dist/ "$DEPLOY_HOST:$DEPLOY_STAGE/"

# --- 4. Swap and reload (root) -----------------------------------------------------------
# shellcheck disable=SC2016  # expanded on the server, not here
SWAP_SCRIPT='
set -euo pipefail
cd "$DEPLOY_DIR"
[ -d dist ] || { echo "no dist/ in $DEPLOY_DIR" >&2; exit 1; }
SRC="$(getent passwd "$SUDO_USER" | cut -d: -f6)/$DEPLOY_STAGE/"
[ -f "$SRC/server/main.js" ] || { echo "staging dir $SRC has no server/main.js" >&2; exit 1; }
rm -rf dist.new
rsync -a --delete --chown=root:root "$SRC" dist.new/
rm -rf dist.prev
mv dist dist.prev
mv dist.new dist
pm2 reload "$DEPLOY_PM2_APP" >/dev/null
echo "swapped: dist <- $(sed -n "s/^commit=//p" dist/DEPLOYED_FROM), previous kept as dist.prev"
'
# shellcheck disable=SC2016  # expanded on the server, not here
ROLLBACK_SCRIPT='
set -euo pipefail
cd "$DEPLOY_DIR"
[ -d dist.prev ] || { echo "no dist.prev to roll back to" >&2; exit 1; }
rm -rf dist.bad
mv dist dist.bad
mv dist.prev dist
pm2 reload "$DEPLOY_PM2_APP" >/dev/null
echo "rolled back: dist <- previous build, failed one kept as dist.bad"
'
remote_root "$SWAP_SCRIPT" "DEPLOY_DIR=$DEPLOY_DIR" "DEPLOY_STAGE=$DEPLOY_STAGE" "DEPLOY_PM2_APP=$DEPLOY_PM2_APP"

# --- 5. Verify, roll back on failure ------------------------------------------------------
if [ -z "$CHECK_URL" ]; then
  info "CHECK_URL not set — skipping verification. Deployed $COMMIT."
  exit 0
fi
[ "$DRY_RUN" = 1 ] && { info "[dry-run] would verify $CHECK_URL${CHECK_GREP:+ for /$CHECK_GREP/}"; exit 0; }

info "verifying $CHECK_URL (up to ${CHECK_TIMEOUT}s)"
deadline=$(( $(date +%s) + CHECK_TIMEOUT ))
last=""
while :; do
  body=$(curl -fsS -m 30 "$CHECK_URL" 2>&1) && {
    if [ -z "$CHECK_GREP" ] || grep -Eq -- "$CHECK_GREP" <<<"$body"; then
      info "OK — $CHECK_URL passed. Deployed $COMMIT."
      exit 0
    fi
    last="page loaded but /$CHECK_GREP/ not found"
  } || last="request failed: $(tail -1 <<<"$body")"
  [ "$(date +%s)" -ge "$deadline" ] && break
  sleep 5
done

info "verification FAILED ($last) — rolling back"
remote_root "$ROLLBACK_SCRIPT" "DEPLOY_DIR=$DEPLOY_DIR" "DEPLOY_PM2_APP=$DEPLOY_PM2_APP"
die "deploy of $COMMIT rolled back"
