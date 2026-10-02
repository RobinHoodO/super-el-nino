#!/bin/sh
# Builds the Vercel site from src/:
#   src/page.html     -> site/index.html          (public; full transcripts stripped)
#   src/meetings.html -> site/meetings/index.html (behind the password form in middleware.js)
set -e
D="$(cd "$(dirname "$0")" && pwd)"

wrap() { # $1 = robots meta value
  printf '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n<meta name="robots" content="%s">\n' "$1"
  printf '<meta name="description" content="Who is preparing for the 2026–27 El Niño, the funding gaps, forgotten impacts, and how a small group can help.">\n'
  printf '<style>*,*::before,*::after{box-sizing:border-box}:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}img{max-width:100%%}[hidden]{display:none!important}</style>\n</head>\n<body>\n'
  cat
  printf '\n</body>\n</html>\n'
}

awk '/<!-- PRIVATE START -->/{skip=1;next} /<!-- PRIVATE END -->/{skip=0;next} !skip' "$D/src/page.html" \
  | wrap "index,follow" > "$D/site/index.html"
mkdir -p "$D/site/meetings"
wrap "noindex,nofollow" < "$D/src/meetings.html" > "$D/site/meetings/index.html"
echo "built site/index.html + site/meetings/index.html"
