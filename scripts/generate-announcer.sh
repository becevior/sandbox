#!/usr/bin/env bash
# Renders the Mascot Kombat announcer lines to public/audio/announcer/*.mp3.
# macOS only: uses the built-in "Daniel" voice, then ffmpeg (with rubberband)
# drops the pitch, slows the delivery, adds grit, and puts it in an arena.
set -euo pipefail

cd "$(dirname "$0")/.."
out="public/audio/announcer"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
mkdir -p "$out"

voice="${ANNOUNCER_VOICE:-Daniel}"

# name|text|rate (words per minute)
lines=(
  "round1|Round one.|150"
  "round2|Round two.|150"
  "round3|Round three.|150"
  "finalRound|Final round.|145"
  "fight|Fight!|170"
  "finishHim|Finish him!|135"
  "fatality|Fatality.|130"
  "flawless|Flawless victory.|140"
  "mooseWins|Mariner Moose wins.|150"
  "duckWins|Oregon Duck wins.|150"
  "draw|Draw.|150"
)

chain="silenceremove=start_periods=1:start_threshold=-45dB,rubberband=pitch=0.72:tempo=0.86:formant=shifted:pitchq=quality,"
chain+="highpass=f=70,bass=g=7:f=140,treble=g=4:f=3200,"
chain+="acompressor=threshold=-20dB:ratio=6:attack=4:release=140:makeup=7,"
chain+="volume=3dB,asoftclip=type=tanh,"
chain+="apad=pad_dur=0.9,"
chain+="aecho=0.85:0.55:70|150|260:0.32|0.2|0.1,"
chain+="loudnorm=I=-13:LRA=6:TP=-1"

for entry in "${lines[@]}"; do
  IFS="|" read -r name text rate <<<"$entry"
  say -v "$voice" -r "$rate" -o "$tmp/$name.aiff" "$text"
  ffmpeg -hide_banner -loglevel error -y -i "$tmp/$name.aiff" -af "$chain" -ac 1 -ar 44100 -b:a 96k "$out/$name.mp3"
  echo "$out/$name.mp3"
done
