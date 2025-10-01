#!/usr/bin/env python3
"""
Compare JSON5 translation files to find missing and orphaned keys.
"""

import argparse
import json5
import sys
from pathlib import Path


def load_json5_keys(file_path):
    """
    Load all keys from a JSON5 file.

    Args:
        file_path: Path to JSON5 file

    Returns:
        Set of all keys in the file
    """
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json5.load(f)
    return set(data.keys())


def load_json5_data(file_path):
    """
    Load all data from a JSON5 file.

    Args:
        file_path: Path to JSON5 file

    Returns:
        Dictionary with all data from the file
    """
    with open(file_path, 'r', encoding='utf-8') as f:
        return json5.load(f)


def save_json5_data(file_path, data):
    """
    Save data to a JSON5 file.

    Args:
        file_path: Path to JSON5 file
        data: Dictionary to save
    """
    with open(file_path, 'w', encoding='utf-8') as f:
        json5.dump(data, f, indent=2, quote_keys=True, trailing_commas=False, ensure_ascii=False)
        f.write('\n')  # Add newline at end of file


def main():
    parser = argparse.ArgumentParser(
        description='Compare JSON5 translation files to find missing and orphaned keys'
    )
    parser.add_argument(
        '--en',
        default='src/assets/i18n/en.json5',
        help='Path to English translations file (default: src/assets/i18n/en.json5)'
    )
    parser.add_argument(
        '--pl',
        default='src/assets/i18n/pl.json5',
        help='Path to Polish translations file (default: src/assets/i18n/pl.json5)'
    )
    parser.add_argument(
        '--missing',
        action='store_true',
        help='Show only keys present in en.json5 but NOT in pl.json5'
    )
    parser.add_argument(
        '--orphaned',
        action='store_true',
        help='Show only keys present in pl.json5 but NOT in en.json5'
    )
    parser.add_argument(
        '--add-keys',
        action='store_true',
        help='Add missing keys from en.json5 to pl.json5 with English values as placeholders'
    )

    args = parser.parse_args()

    # Load keys from both files
    try:
        en_keys = load_json5_keys(args.en)
        pl_keys = load_json5_keys(args.pl)
    except FileNotFoundError as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Error loading JSON5 files: {e}", file=sys.stderr)
        sys.exit(1)

    # Calculate differences
    missing_in_pl = sorted(en_keys - pl_keys)
    orphaned_in_pl = sorted(pl_keys - en_keys)

    # Handle --add-keys option
    if args.add_keys:
        if not missing_in_pl:
            print(f"No missing keys to add. {args.pl} is up to date!")
            sys.exit(0)

        print(f"Adding {len(missing_in_pl)} missing keys to {args.pl}...")
        print()

        # Load full data from both files
        en_data = load_json5_data(args.en)
        pl_data = load_json5_data(args.pl)

        # Add missing keys with English values
        keys_added = []
        for key in missing_in_pl:
            pl_data[key] = en_data[key]
            keys_added.append(key)

        # Save updated Polish file
        save_json5_data(args.pl, pl_data)

        print(f"✅ Successfully added {len(keys_added)} keys to {args.pl}")
        print()
        print("Added keys:")
        for key in keys_added[:10]:  # Show first 10
            print(f"  {key}")
        if len(keys_added) > 10:
            print(f"  ... and {len(keys_added) - 10} more")
        print()
        print("⚠️  These keys have English values and need to be translated to Polish.")
        sys.exit(0)

    # Determine what to show
    show_missing = args.missing or not (args.missing or args.orphaned)
    show_orphaned = args.orphaned or not (args.missing or args.orphaned)

    # Display results
    if show_missing and missing_in_pl:
        print(f"Keys in {args.en} but NOT in {args.pl} ({len(missing_in_pl)}):")
        print("=" * 80)
        for key in missing_in_pl:
            print(f"  {key}")
        print()
    elif show_missing:
        print(f"No missing keys in {args.pl}")
        print()

    if show_orphaned and orphaned_in_pl:
        print(f"Keys in {args.pl} but NOT in {args.en} ({len(orphaned_in_pl)}):")
        print("=" * 80)
        for key in orphaned_in_pl:
            print(f"  {key}")
        print()
    elif show_orphaned:
        print(f"No orphaned keys in {args.pl}")
        print()

    # Summary
    if show_missing and show_orphaned:
        print("Summary:")
        print(f"  Total keys in {args.en}: {len(en_keys)}")
        print(f"  Total keys in {args.pl}: {len(pl_keys)}")
        print(f"  Missing translations in pl.json5: {len(missing_in_pl)}")
        print(f"  Orphaned translations in pl.json5: {len(orphaned_in_pl)}")


if __name__ == '__main__':
    main()
