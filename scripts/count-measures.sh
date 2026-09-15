#!/usr/bin/env bash
# Stream one reply below 20 finished messages and count native measure() calls per markdown view.
# Needs the ENRM_MEASURE log line from patches/ and an installed build of this app.
set -euo pipefail

serial=${ANDROID_SERIAL:?set ANDROID_SERIAL to the emulator or device serial}
package=dev.repro.enrichedmarkdownremeasure
adb() { command adb -s "$serial" "$@"; }

adb logcat -c
adb shell am force-stop "$package"
adb shell monkey -p "$package" -c android.intent.category.LAUNCHER 1 > /dev/null
sleep 8

# Tap "Stream a reply" at the centre of its bounds from the accessibility dump.
adb shell uiautomator dump /sdcard/repro-ui.xml > /dev/null
ui=$(adb shell cat /sdcard/repro-ui.xml)
# Android buttons show their title in capitals, so match the label without case.
bounds=$(echo "$ui" | grep -ioE 'text="Stream a reply"[^>]*bounds="\[[0-9]+,[0-9]+\]\[[0-9]+,[0-9]+\]"' | grep -oE '\[[0-9]+,[0-9]+\]\[[0-9]+,[0-9]+\]' || true)
[ -n "$bounds" ] || { echo "error: 'Stream a reply' button not found on screen"; exit 1; }
read -r x1 y1 x2 y2 <<< "$(echo "$bounds" | grep -oE '[0-9]+' | tr '\n' ' ')"
adb logcat -c
adb shell input tap $(( (x1 + x2) / 2 )) $(( (y1 + y2) / 2 ))
sleep 9

log=$(mktemp)
adb logcat -d -s ENRM_MEASURE > "$log"
echo "measure() calls per markdown view during one streamed reply (tag, calls, last markdown length):"
grep -oE "tag=[0-9]+ len=[0-9]+" "$log" \
  | awk '{split($1, t, "="); split($2, l, "="); calls[t[2]]++; length_of[t[2]] = l[2]} END {for (tag in calls) printf "%s %d %d\n", tag, calls[tag], length_of[tag]}' \
  | sort -k3 -n | awk '{printf "  tag %-5s calls %-4s length %s\n", $1, $2, $3}'
echo "total measure() calls: $(grep -c ENRM_MEASURE "$log")"
rm -f "$log"
