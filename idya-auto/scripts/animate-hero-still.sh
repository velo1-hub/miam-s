#!/usr/bin/env bash
# Composites the « Signature rouge » light choreography (brief §11.1) over a still Higgsfield keyframe.
# Only the light moves: red blade sweep (0.5–3.0 s), headlight flare + red floor glow (3.0–4.5 s), return (→ 7.0 s).
# usage: scripts/animate-hero-still.sh in.png out.mp4 W H sweepFrom sweepTo glowCx glowCy glowRx glowRy lampCx lampCy lampRx lampRy
#   (positions are fractions of the frame; sweepFrom/To are the x of the blade at 0.5 s and 3.0 s)
# Shipped masters (brief §29.1 keyframes in docs/brand/):
#   scripts/animate-hero-still.sh docs/brand/hero-keyframe-16x9.png /tmp/master-land.mp4 1920 1080 1.08 0.22 0.62 0.86 0.45 0.14 0.45 0.53 0.20 0.08
#   scripts/animate-hero-still.sh docs/brand/hero-keyframe-9x16.png /tmp/master-port.mp4  720 1280 1.08 0.02 0.50 0.46 0.50 0.08 0.28 0.32 0.22 0.05
#   scripts/encode-hero.sh /tmp/master-land.mp4 /tmp/master-port.mp4
set -euo pipefail
IN=$1; OUT=$2; W=$3; H=$4; S0=$5; S1=$6; GCX=$7; GCY=$8; GRX=$9; GRY=${10}; LCX=${11}; LCY=${12}; LRX=${13}; LRY=${14}
MW=$((W/4)); MH=$((H/4))
E1="clip((T-0.5)/0.3,0,1)*clip((3.0-T)/0.3,0,1)"
P="clip((T-0.5)/2.5,0,1)"
CX="($S0-($S0-$S1)*($P*$P*(3-2*$P)))"
SWEEP="255*$E1*exp(-pow(X/W-$CX,2)/(2*0.055*0.055))"
E2="clip((T-3.0)/1.0,0,1)*clip((6.5-T)/2.5,0,1)"
GLOW="255*$E2*0.9*exp(-(pow((X/W-$GCX)/$GRX,2)+pow((Y/H-$GCY)/$GRY,2))*1.5)"
E3="clip((T-3.0)/0.6,0,1)*clip((6.0-T)/1.5,0,1)"
LAMP="255*$E3*exp(-(pow((X/W-$LCX)/$LRX,2)+pow((Y/H-$LCY)/$LRY,2))*1.2)"
ffmpeg -y -hide_banner -loglevel error \
  -loop 1 -framerate 24 -t 7 -i "$IN" \
  -f lavfi -i "color=c=black:s=${MW}x${MH}:r=24:d=7" \
  -f lavfi -i "color=c=black:s=${MW}x${MH}:r=24:d=7" \
  -f lavfi -i "color=c=black:s=${MW}x${MH}:r=24:d=7" \
  -f lavfi -i "color=c=0xC00A00:s=${W}x${H}:r=24:d=7" \
  -f lavfi -i "color=c=0x3A0200:s=${W}x${H}:r=24:d=7" \
  -filter_complex "
    [0:v]scale=${W}:${H}:flags=lanczos,format=gbrp,split=3[src][srcb][srcc];
    [src]lutrgb=r=val*0.62:g=val*0.62:b=val*0.62[base];
    [srcb]eq=brightness=0.05:contrast=1.10:saturation=1.15,format=gbrp[brightpre];[5:v]format=gbrp[redsoft];[brightpre][redsoft]blend=all_mode=screen[bright];
    [srcc]eq=brightness=0.14:contrast=1.08,format=gbrp[brightest];
    [1:v]format=gray,geq=lum='$SWEEP',scale=${W}:${H}:flags=bicubic,format=gbrp[m1];
    [2:v]format=gray,geq=lum='$GLOW',scale=${W}:${H}:flags=bicubic,format=gbrp[m2];
    [3:v]format=gray,geq=lum='$LAMP',scale=${W}:${H}:flags=bicubic,format=gbrp[m3];
    [base][bright][m1]maskedmerge[s1];
    [s1]split[s1a][s1b];
    [4:v]format=gbrp[red];
    [s1a][red]blend=all_mode=screen[redmix];
    [s1b][redmix][m2]maskedmerge[s2];
    [s2][brightest][m3]maskedmerge[s3];
    [s3]format=yuv420p[v]" \
  -map "[v]" -r 24 -frames:v 168 -c:v libx264 -preset slow -crf 14 -pix_fmt yuv420p "$OUT"
