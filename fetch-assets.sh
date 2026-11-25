#!/bin/bash
# Run this ONCE, before cancelling Squarespace, from inside the site folder:
#   cd path/to/trifocal-site && bash fetch-assets.sh
# It downloads every photo the site uses from Squarespace into assets/img/ and points the pages at
# those local copies. If ffmpeg is installed (brew install ffmpeg), it also saves the videos.
cd "$(dirname "$0")"
mkdir -p assets/img assets/video

# every Squarespace image URL in every page (perl finds all matches on a line, unlike macOS grep -o)
urls=$(find . -name '*.html' -exec perl -ne 'print "$1\n" while m#(https://images\.squarespace-cdn\.com/content/v1/[^"?\s]+\?format=\d+w)#g' {} + | sort -u)
count=0; failed=0
for u in $urls; do
  path="${u#https://images.squarespace-cdn.com/content/v1/}"; path="${path%%\?*}"
  name=$(echo "$path" | tr '/' '-' | sed 's/%2B/-/g; s/+/-/g')
  if [ ! -s "assets/img/$name" ]; then
    if ! curl -fsSL "${u%%\?*}?format=2500w" -o "assets/img/$name"; then
      echo "Could not download $u"; rm -f "assets/img/$name"; failed=$((failed+1)); continue
    fi
  fi
  find . -name '*.html' -exec perl -pi -e "s#\Q$u\E#/assets/img/$name#g" {} +
  count=$((count+1))
done
left=$(find . -name '*.html' -exec perl -ne 'print "$1\n" while m#(https://images\.squarespace-cdn\.com/[^"?\s]+)#g' {} + | sort -u | wc -l | tr -d ' ')
echo "Photos: $count saved and linked, $failed failed, $left still pointing at Squarespace."

if command -v ffmpeg >/dev/null; then
  ids=$(find . -name '*.html' -exec perl -ne 'print "$1\n" while m#data-sq="([^"]+)"#g' {} + | sort -u)
  picky=""; ffmpeg -hide_banner -h demuxer=hls 2>/dev/null | grep -q extension_picky && picky="-extension_picky 0"
  ok=0; bad=""
  for id in $ids; do
    if [ -s "assets/video/$id.mp4" ]; then ok=$((ok+1)); continue; fi
    echo "Saving video $id ..."
    if ffmpeg -nostdin -loglevel error -user_agent "Mozilla/5.0 (Macintosh)" \
         -headers "Referer: https://www.trifocalmedia.com/" \
         -allowed_extensions ALL $picky \
         -i "https://video.squarespace-cdn.com/content/v1/627929dc40cfe238326720cd/$id/playlist.m3u8" \
         -c copy -bsf:a aac_adtstoasc -movflags +faststart -y "assets/video/$id.mp4" && [ -s "assets/video/$id.mp4" ]; then
      ok=$((ok+1))
    else
      rm -f "assets/video/$id.mp4"; bad="$bad $id"
    fi
  done
  echo "Videos: $ok saved."
  [ -n "$bad" ] && echo "Videos still to export from your own files (name each <id>.mp4):$bad"
else
  echo "ffmpeg not found: videos keep streaming from Squarespace for now. See DEPLOY.md."
fi
echo "Done."
