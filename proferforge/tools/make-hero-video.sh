#!/usr/bin/env bash
# Turn raw footage into the web-ready hero assets the site picks up automatically.
#   bash proferforge/tools/make-hero-video.sh raw-footage.mov [start_seconds] [duration_seconds]
# Output: src/assets/video/hero.mp4 (H.264), hero.webm (VP9), src/assets/img/hero-poster.jpg. No audio, 1080p max, ~12 s.
set -euo pipefail
IN="${1:?usage: make-hero-video.sh input [start] [duration]  (PINGPONG=1 plays the clip forward then backward for a seamless loop)}"; SS="${2:-0}"; T="${3:-12}"
if [ "${PINGPONG:-0}" = "1" ]; then TMP="$(mktemp --suffix=.mp4)"; ffmpeg -loglevel error -y -i "$IN" -an -filter_complex "[0:v]split[a][b];[b]reverse[r];[a][r]concat=n=2:v=1:a=0" "$TMP"; IN="$TMP"; SS=0; T=60; fi
OUT="$(cd "$(dirname "$0")/.." && pwd)/src/assets"; mkdir -p "$OUT/video" "$OUT/img"
VF="scale='min(1920,iw)':-2,fps=30,format=yuv420p"
ffmpeg -loglevel error -y -ss "$SS" -t "$T" -i "$IN" -an -vf "$VF" -c:v libx264 -preset slow -crf 26 -movflags +faststart "$OUT/video/hero.mp4"
ffmpeg -loglevel error -y -ss "$SS" -t "$T" -i "$IN" -an -vf "$VF" -c:v libvpx-vp9 -b:v 0 -crf 36 -row-mt 1 "$OUT/video/hero.webm"
ffmpeg -loglevel error -y -ss "$SS" -i "$IN" -frames:v 1 -update 1 -vf "scale='min(1920,iw)':-2" -q:v 4 "$OUT/img/hero-poster.jpg"
ls -lh "$OUT/video" "$OUT/img"
echo "Tip: for a seamless loop, pick a clip whose first and last frames are similar, or crossfade them in your editor."
