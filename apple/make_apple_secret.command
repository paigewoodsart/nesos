#!/bin/zsh
# Double-click to make the Apple sign-in secret and copy it, ready to paste into Vercel.
source ~/.zprofile 2>/dev/null
source ~/.zshrc 2>/dev/null
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
cd "$(dirname "$0")"
if ! command -v node >/dev/null; then
  echo ""
  echo "Node isn't installed on this Mac, so the secret couldn't be made. Tell Claude."
  echo ""
  exit 1
fi
node apple_secret.mjs
echo "You can close this window."
