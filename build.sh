#!/bin/sh
# Wraps src/page.html (the Claude artifact body) into a full page for Vercel: site/index.html
set -e
D="$(cd "$(dirname "$0")" && pwd)"
{
  printf '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
  printf '<meta name="description" content="Who is preparing for the 2026–27 El Niño, the funding gaps, forgotten impacts, and how a small group can help.">\n'
  printf '<style>*,*::before,*::after{box-sizing:border-box}:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}img{max-width:100%%}[hidden]{display:none!important}</style>\n</head>\n<body>\n'
  cat "$D/src/page.html"
  printf '\n</body>\n</html>\n'
} > "$D/site/index.html"
echo "built site/index.html"
