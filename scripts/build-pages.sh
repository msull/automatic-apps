#!/usr/bin/env bash
# Assembles the docs/ folder for GitHub Pages.
# The directory HTML becomes the landing page, and each app is copied in.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DOCS="$ROOT/docs"

# Clean and recreate
rm -rf "$DOCS"
mkdir -p "$DOCS"

# Landing page
cp "$ROOT/DIRECTORY.html" "$DOCS/index.html"

# Copy each app (index.html + any assets like screenshots)
for app_dir in "$ROOT"/apps/*/; do
  app_name="$(basename "$app_dir")"
  mkdir -p "$DOCS/apps/$app_name"
  # Copy everything except test files
  find "$app_dir" -maxdepth 1 -type f ! -name '*.spec.ts' -exec cp {} "$DOCS/apps/$app_name/" \;
done

echo "Built docs/ with $(ls -d "$DOCS"/apps/*/ 2>/dev/null | wc -l | tr -d ' ') app(s)"
