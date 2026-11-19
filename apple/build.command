#!/bin/bash
# Double-click to build Nesos for iPhone and Mac.
# Writes build.log (errors only) and build-full.log next to this file
# so Claude can read the results.
cd "$(dirname "$0")"
: > build.log
for TARGET in "iOS|generic/platform=iOS Simulator" "Mac|platform=macOS"; do
  NAME="${TARGET%%|*}"
  DEST="${TARGET#*|}"
  echo "=== Building for $NAME ===" | tee -a build.log
  xcodebuild -project Nesos/Nesos.xcodeproj -scheme Nesos \
    -destination "$DEST" -derivedDataPath .build \
    CODE_SIGNING_ALLOWED=NO build > "build-full-$NAME.log" 2>&1
  grep -E "error:|BUILD SUCCEEDED|BUILD FAILED" "build-full-$NAME.log" | sort -u | tee -a build.log
done
echo ""
echo "Done. You can close this window and tell Claude."
