#!/bin/bash
# ─────────────────────────────────────────────────────────
# WELL with Loretta — Screenshot Exporter
# Exports all app store slides as PNG images at correct sizes
# ─────────────────────────────────────────────────────────

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SCREENSHOTS_DIR="$SCRIPT_DIR/app-store-screenshots"
EXPORT_DIR="$SCRIPT_DIR/exports"

# Check Chrome is installed
if [ ! -f "$CHROME" ]; then
  echo ""
  echo "ERROR: Google Chrome not found."
  echo "Please install Chrome from https://www.google.com/chrome"
  exit 1
fi

mkdir -p "$EXPORT_DIR"

echo ""
echo "WELL with Loretta — Exporting screenshots..."
echo "────────────────────────────────────────────"

# ── App Store slides: 430×932 viewport at 3x = 1290×2796px output ──
declare -a SLIDES=(
  "slide-1-hero"
  "slide-2-community"
  "slide-3-channels"
  "slide-4-calendar"
  "slide-5-cta"
  "slide-nutrition"
)

for SLIDE in "${SLIDES[@]}"; do
  echo "  Exporting $SLIDE..."
  "$CHROME" \
    --headless=new \
    --disable-gpu \
    --no-sandbox \
    --hide-scrollbars \
    --window-size=430,932 \
    --force-device-scale-factor=3 \
    --screenshot="$EXPORT_DIR/$SLIDE.png" \
    "file://$SCREENSHOTS_DIR/$SLIDE.html" 2>/dev/null
  sleep 1
done

# ── Google Play Feature Graphic: 1024×500 at 1x ──
echo "  Exporting google-play-feature-graphic..."
"$CHROME" \
  --headless=new \
  --disable-gpu \
  --no-sandbox \
  --hide-scrollbars \
  --window-size=1024,500 \
  --force-device-scale-factor=1 \
  --screenshot="$EXPORT_DIR/google-play-feature-graphic.png" \
  "file://$SCREENSHOTS_DIR/google-play-feature-graphic.html" 2>/dev/null

echo ""
echo "────────────────────────────────────────────"
echo "Done! All files saved to:"
echo ""
echo "  $EXPORT_DIR"
echo ""
echo "App Store screenshots (1290 × 2796 px):"
for SLIDE in "${SLIDES[@]}"; do
  echo "    $SLIDE.png"
done
echo ""
echo "Google Play Feature Graphic (1024 × 500 px):"
echo "    google-play-feature-graphic.png"
echo ""
