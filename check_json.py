#!/usr/bin/env python3
"""
check_json.py — simple JSON validation CLI

Usage:
    python check_json.py path/to/file.json
"""

import sys
import json
from pathlib import Path

def check_json_file(path):
    try:
        with open(path, 'r', encoding='utf-8') as f:
            json.load(f)
        print(f"✅ {path}: valid JSON.")
        return 0
    except FileNotFoundError:
        print(f"❌ {path}: file not found.")
        return 1
    except json.JSONDecodeError as e:
        print(f"❌ {path}: invalid JSON at line {e.lineno}, column {e.colno}")
        print(f"   → {e.msg}")
        return 1
    except Exception as e:
        print(f"⚠️  {path}: unexpected error: {e}")
        return 1

def main():
    if len(sys.argv) != 2:
        print("Usage: python check_json.py path/to/file.json")
        sys.exit(1)

    file_path = Path(sys.argv[1])
    sys.exit(check_json_file(file_path))

if __name__ == "__main__":
    main()
