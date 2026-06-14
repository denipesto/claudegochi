#!/bin/sh
# cc-statusline one-liner bootstrap (macOS / Linux / Git Bash).
#   curl -fsSL https://raw.githubusercontent.com/denipesto/cc-statusline/main/install.sh | sh
# Clones (or updates) the repo into ~/.cc-statusline and runs the installer.

set -e
REPO="https://github.com/denipesto/cc-statusline.git"
DIR="$HOME/.cc-statusline"

for cmd in git node; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "✗ '$cmd' not found in PATH. Install it first." >&2
    exit 1
  fi
done

if [ -d "$DIR/.git" ]; then
  echo "↻ updating $DIR"
  git -C "$DIR" pull --ff-only
else
  echo "↓ cloning into $DIR"
  git clone --depth 1 "$REPO" "$DIR"
fi

node "$DIR/bin/install.mjs" "$@"
