#!/usr/bin/env bash
# Encodes the hero deliverables (brief §11.2) from either a master video or a frame sequence.
#
#   scripts/encode-hero.sh master.mp4 [master-portrait.mp4]
#   scripts/encode-hero.sh --frames .cache/hero/landscape [.cache/hero/portrait] [--fps 24]
#
# Output in public/media/: hero-1080.av1.mp4 (≤ 2.5 MB), hero-1080.h264.mp4 (≤ 4.5 MB),
# hero-mobile.h264.mp4 (≤ 2 MB), hero-poster.avif (≤ 120 KB), hero-poster-mobile.avif (≤ 60 KB).
# Every output is trimmed to exactly 7.000 s, has no audio and is faststart. Pass --crossfade to
# add a 0.3 s end→start crossfade when the master's loop point shows a jump.
set -euo pipefail
cd "$(dirname "$0")/.."
OUT=public/media
mkdir -p "$OUT"
FPS=24
CROSSFADE=0
MODE=video
ARGS=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --frames) MODE=frames; shift ;;
    --fps) FPS="$2"; shift 2 ;;
    --crossfade) CROSSFADE=1; shift ;;
    *) ARGS+=("$1"); shift ;;
  esac
done
LAND="${ARGS[0]:-}"
PORT="${ARGS[1]:-}"
[[ -n "$LAND" ]] || { echo "usage: $0 <master.mp4|--frames dir> [portrait]"; exit 1; }

input_args() { # $1 = source
  if [[ "$MODE" == frames ]]; then echo -framerate "$FPS" -i "$1/%04d.png"; else echo -i "$1"; fi
}

# Build the 7.000 s landscape intermediate (lossless-ish) so every delivery shares one timeline
TMP=$(mktemp -d)
LOOPF=""
if [[ "$CROSSFADE" == 1 ]]; then
  # 0.3 s crossfade of the tail into the head: split, offset, blend, trim back to 7.0 s
  LOOPF="-filter_complex [0:v]split[a][b];[a]trim=0:6.7,setpts=PTS-STARTPTS[head];[b]trim=6.7:7.0,setpts=PTS-STARTPTS[tail];[0:v]trim=0:0.3,setpts=PTS-STARTPTS[start];[tail][start]blend=all_expr='A*(1-T/0.3)+B*(T/0.3)'[x];[head][x]concat=n=2:v=1:a=0[v] -map [v]"
fi
# shellcheck disable=SC2086
ffmpeg -y -hide_banner -loglevel error $(input_args "$LAND") $LOOPF -t 7.000 -an -vf "scale=1920:1080:flags=lanczos,format=yuv420p" -c:v libx264 -preset veryslow -crf 18 "$TMP/land.mp4"

# H.264 High 1080p
ffmpeg -y -hide_banner -loglevel error -i "$TMP/land.mp4" -t 7.000 -an -c:v libx264 -profile:v high -preset slow -crf 24 -pix_fmt yuv420p -movflags +faststart "$OUT/hero-1080.h264.mp4"
# AV1 1080p (SVT-AV1)
ffmpeg -y -hide_banner -loglevel error -i "$TMP/land.mp4" -t 7.000 -an -c:v libsvtav1 -preset 5 -crf 38 -pix_fmt yuv420p -movflags +faststart "$OUT/hero-1080.av1.mp4"
# Poster = first frame, AVIF 1920 w
ffmpeg -y -hide_banner -loglevel error -i "$TMP/land.mp4" -frames:v 1 -vf "scale=1920:-2" -c:v libaom-av1 -still-picture 1 -crf 32 -cpu-used 4 "$OUT/hero-poster.avif"

if [[ -n "$PORT" ]]; then
  # shellcheck disable=SC2086
  ffmpeg -y -hide_banner -loglevel error $(input_args "$PORT") -t 7.000 -an -vf "scale=720:1280:flags=lanczos,format=yuv420p" -c:v libx264 -profile:v high -preset slow -crf 25 -movflags +faststart "$OUT/hero-mobile.h264.mp4"
  ffmpeg -y -hide_banner -loglevel error -i "$OUT/hero-mobile.h264.mp4" -frames:v 1 -c:v libaom-av1 -still-picture 1 -crf 34 -cpu-used 4 "$OUT/hero-poster-mobile.avif"
fi
rm -rf "$TMP"
echo "Deliverables:"
ls -la "$OUT" | awk 'NR>1 {printf "  %-28s %6.0f KB\n", $9, $5/1024}'
