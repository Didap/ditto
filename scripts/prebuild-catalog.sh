#!/bin/bash
# Pre-download all catalog design .md files from getdesign
# Run once locally, commit the results to data/catalog/

set -e

CATALOG_DIR="data/catalog"
mkdir -p "$CATALOG_DIR"

# Get the list of brands from our catalog.ts _source fields
SOURCES=$(grep '_source:' src/lib/catalog.ts | sed 's/.*_source: "\([^"]*\)".*/\1/')

for brand in $SOURCES; do
  outfile="$CATALOG_DIR/${brand}.md"
  if [ -f "$outfile" ]; then
    echo "  skip $brand (exists)"
    continue
  fi
  echo "  fetch $brand..."
  npx getdesign@latest add "$brand" --out "$outfile" 2>/dev/null || echo "  FAILED: $brand"
done

echo "Done. Files in $CATALOG_DIR:"
ls -1 "$CATALOG_DIR" | wc -l
