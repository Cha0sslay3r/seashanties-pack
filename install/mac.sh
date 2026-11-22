#!/bin/bash
# Freedom V4: Sea Shanties - one-line installer for macOS.
#   curl -fsSL https://raw.githubusercontent.com/Cha0sslay3r/seashanties-pack/main/install/mac.sh | bash
# Installs Prism Launcher (if missing), adds the Sea Shanties instance (auto-updates on every Play), opens Prism.
# Safe to run again: it skips whatever is already there.  DRY=1 = only print what it would do.
set -e
PACK_URL="https://raw.githubusercontent.com/Cha0sslay3r/seashanties-pack/main/prism/Freedom-V4-Sea-Shanties-Prism.zip"
NAME="Freedom V4: Sea Shanties"
say() { printf '\033[1;36m==>\033[0m %s\n' "$1"; }
run() { if [ -n "$DRY" ]; then echo "   (dry run) $*"; else "$@"; fi; }

# 1. Prism Launcher
APP=""
for a in "/Applications/Prism Launcher.app" "$HOME/Applications/Prism Launcher.app"; do [ -d "$a" ] && APP="$a"; done
if [ -z "$APP" ]; then
  say "Downloading Prism Launcher..."
  URL=$(curl -fsSL https://api.github.com/repos/PrismLauncher/PrismLauncher/releases/latest | grep -o '"browser_download_url": *"[^"]*macOS-[0-9.]*\.zip"' | head -1 | sed 's/.*"\(https[^"]*\)"/\1/')
  [ -n "$URL" ] || { echo "Could not find the Prism download. Get it from https://prismlauncher.org/download/"; exit 1; }
  TMP=$(mktemp -d)
  run curl -fL --progress-bar -o "$TMP/prism.zip" "$URL"
  DEST=/Applications; [ -w /Applications ] || { DEST="$HOME/Applications"; mkdir -p "$DEST"; }
  say "Installing Prism Launcher to $DEST..."
  run ditto -x -k "$TMP/prism.zip" "$DEST"
  APP="$DEST/Prism Launcher.app"
  run xattr -dr com.apple.quarantine "$APP" 2>/dev/null || true
  rm -rf "$TMP"
else
  say "Prism Launcher is already installed."
fi

# 2. The pack
INST="$HOME/Library/Application Support/PrismLauncher/instances"
if grep -qs "^name=$NAME" "$INST"/*/instance.cfg; then
  say "Sea Shanties is already in Prism - opening it."
  run open "$APP"
else
  say "Adding Sea Shanties to Prism (click OK if Prism asks)..."
  if [ -n "$DRY" ]; then echo "   (dry run) \"$APP/Contents/MacOS/prismlauncher\" --import $PACK_URL"
  else ("$APP/Contents/MacOS/prismlauncher" --import "$PACK_URL" >/dev/null 2>&1 &); fi
fi
cat <<'MSG'

  All set! In Prism Launcher:
   1. First time only: finish the quick setup and sign in with your Microsoft account
      (top right: Accounts > Manage Accounts > Add Microsoft). Let Prism download Java if it asks.
   2. Select "Freedom V4: Sea Shanties" and press Launch.
      The first launch downloads the mods (a few minutes). The server is already in Multiplayer.

MSG
