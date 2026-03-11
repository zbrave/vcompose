#!/bin/bash
cd "$CLAUDE_PROJECT_DIR" || exit 0

# Check if there are any changes
git diff --quiet && git diff --cached --quiet && exit 0

# Stage all changes
git add -A

# Extract commit message from STATUS.md focus section
FOCUS=$(grep -A3 'Mevcut Oturum' docs/STATUS.md 2>/dev/null | grep -v '^#' | grep -v '^$' | grep -v '^---' | head -1 | sed 's/^[[:space:]]*//' | head -c 120)
MSG=${FOCUS:-"session checkpoint"}

# Commit and push
git commit -m "$MSG" && git push 2>/dev/null || true
