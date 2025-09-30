# DSpace Angular Development Makefile
# This Makefile provides convenient targets for common development tasks

.PHONY: help prepare-developer-machine dev start-dev install clean test lint build e2e prod check-node check-npm

# Default target - show help
help:
	@echo "DSpace Angular Development Makefile"
	@echo "===================================="
	@echo ""
	@echo "Available targets:"
	@echo "  make prepare-developer-machine  - Install all prerequisites for development"
	@echo "  make dev                        - Start development server with hot reload (port 4000)"
	@echo "  make start-dev                  - Alias for 'make dev'"
	@echo "  make install                    - Install npm dependencies"
	@echo "  make clean                      - Clean all build artifacts and caches"
	@echo "  make test                       - Run unit tests"
	@echo "  make test-watch                 - Run unit tests in watch mode"
	@echo "  make lint                       - Run ESLint"
	@echo "  make build                      - Build for production"
	@echo "  make e2e                        - Run E2E tests with Cypress"
	@echo "  make prod                       - Build and run production server"
	@echo ""
	@echo "Development server runs on: http://localhost:4000"
	@echo "Required: Node.js v18.x or v20.x, npm >= v10.x"

# Check if Node.js is installed and the right version
check-node:
	@echo "Checking Node.js version..."
	@if ! command -v node >/dev/null 2>&1; then \
		echo "❌ Node.js is not installed"; \
		exit 1; \
	fi
	@NODE_VERSION=$$(node --version | cut -d'v' -f2 | cut -d'.' -f1); \
	if [ "$$NODE_VERSION" != "18" ] && [ "$$NODE_VERSION" != "20" ]; then \
		echo "❌ Node.js version $$NODE_VERSION is not supported. Please use v18.x or v20.x"; \
		echo "   Tip: Use nvm to manage Node versions"; \
		exit 1; \
	else \
		echo "✅ Node.js version is compatible: $$(node --version)"; \
	fi

# Check if npm is installed and the right version
check-npm:
	@echo "Checking npm version..."
	@if ! command -v npm >/dev/null 2>&1; then \
		echo "❌ npm is not installed"; \
		exit 1; \
	fi
	@NPM_VERSION=$$(npm --version | cut -d'.' -f1); \
	if [ "$$NPM_VERSION" -lt 10 ]; then \
		echo "❌ npm version $$(npm --version) is too old. Please use npm >= 10.x"; \
		echo "   Run: npm install -g npm@latest"; \
		exit 1; \
	else \
		echo "✅ npm version is compatible: $$(npm --version)"; \
	fi

# Install prerequisites for development
prepare-developer-machine:
	@echo "========================================"
	@echo "Preparing developer machine for DSpace Angular"
	@echo "========================================"
	@echo ""

	# Check for Node.js
	@if ! command -v node >/dev/null 2>&1; then \
		echo "❌ Node.js is not installed"; \
		echo ""; \
		echo "Installing Node.js via nvm..."; \
		if ! command -v nvm >/dev/null 2>&1; then \
			echo "nvm is not installed. Please install it first:"; \
			echo "  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"; \
			echo "Then run: nvm install --lts && nvm use --lts"; \
			exit 1; \
		fi; \
		nvm install 20; \
		nvm use 20; \
	fi

	@$(MAKE) check-node
	@$(MAKE) check-npm

	# Install global tools
	@echo ""
	@echo "Installing global tools..."
	@npm install -g @angular/cli@18 nodemon

	# Install project dependencies
	@echo ""
	@echo "Installing project dependencies..."
	@npm install

	# Build ESLint plugins (required for development)
	@echo ""
	@echo "Building ESLint plugins..."
	@npm run build:lint || echo "Note: ESLint plugins build failed (this is okay for initial setup)"

	@echo ""
	@echo "✅ Developer machine is ready!"
	@echo ""
	@echo "You can now run:"
	@echo "  make dev          - Start development server with hot reload"
	@echo "  make test         - Run unit tests"
	@echo "  make lint         - Check code style"
	@echo ""

# Start development server with hot reload
dev: check-node check-npm
	@echo "Starting development server with hot reload..."
	@echo "Server will be available at: http://localhost:4000"
	@echo "Press Ctrl+C to stop"
	@echo ""
	npm run start:dev

# Alias for dev
start-dev: dev

# Install dependencies only
install: check-node check-npm
	npm install

# Clean all build artifacts and caches
clean:
	@echo "Cleaning all build artifacts and caches..."
	npm run clean

# Run unit tests
test: check-node
	@echo "Running unit tests..."
	npm test

# Run unit tests in watch mode
test-watch: check-node
	@echo "Running unit tests in watch mode..."
	npm run test:watch

# Run linting
lint: check-node
	@echo "Running ESLint..."
	npm run lint

# Fix linting issues
lint-fix: check-node
	@echo "Fixing ESLint issues..."
	npm run lint-fix

# Build for production
build: check-node
	@echo "Building for production..."
	npm run build:prod

# Run E2E tests
e2e: check-node
	@echo "Running E2E tests with Cypress..."
	npm run e2e

# Build and run production server
prod: check-node
	@echo "Building and starting production server..."
	npm start

# Quick status check
status:
	@echo "DSpace Angular Status"
	@echo "===================="
	@node --version 2>/dev/null || echo "Node.js: not installed"
	@npm --version 2>/dev/null && echo "npm: $$(npm --version)" || echo "npm: not installed"
	@ng version 2>/dev/null | grep "Angular CLI" || echo "Angular CLI: not installed globally"
	@echo ""
	@if [ -d "node_modules" ]; then \
		echo "✅ Dependencies are installed"; \
	else \
		echo "❌ Dependencies not installed (run: make install)"; \
	fi
	@if [ -d "dist" ]; then \
		echo "✅ Build artifacts exist"; \
	else \
		echo "ℹ️  No build artifacts (run: make build)"; \
	fi