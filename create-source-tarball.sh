#!/usr/bin/env bash

set -euo pipefail

# Script to create source tarball for Firefox extension submission
# See https://extensionworkshop.com/documentation/publish/source-code-submission/
# Excludes: symlinks, dist directories, node_modules

VERSION="$(node -p "require('./package.json').version")"
TARBALL="artifacts/src/copy_selection_as_markdown-${VERSION}-src.tgz"

# Create artifacts/src directory if it doesn't exist
mkdir -p artifacts/src

# Create tarball excluding unwanted files
tar zcf "$TARBALL" \
  --exclude='*/node_modules' \
  --exclude='*/dist' \
  --exclude='*/.git' \
  --exclude='*/.DS_Store' \
  --exclude='artifacts' \
  --exclude='packages/core/test' \
  --exclude='docs/C*' \
  biome.json \
  package.json \
  pnpm-lock.yaml \
  pnpm-workspace.yaml \
  docs/FOR_AMO_REVIEWER.md \
  packages/

echo "Source tarball created: $TARBALL"
