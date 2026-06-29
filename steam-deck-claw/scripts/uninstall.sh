#!/usr/bin/env bash
# Remove Steam Deck Claw launcher, systemd service, and local config (keeps ~/.openclaw if shared).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/steam-deck-claw"
APPS_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/applications"

info() { printf '\033[1;34m==>\033[0m %s\n' "$*"; }

systemctl --user stop openclaw-gateway.service 2>/dev/null || true
systemctl --user disable openclaw-gateway.service 2>/dev/null || true
rm -f "$HOME/.config/systemd/user/openclaw-gateway.service"
systemctl --user daemon-reload 2>/dev/null || true
info "Removed systemd service"

rm -f "$APPS_DIR/steam-deck-claw.desktop"
info "Removed desktop launcher"

read -r -p "Delete $CONFIG_DIR (API key + token)? [y/N] " ans
if [[ "${ans,,}" == "y" ]]; then
  rm -rf "$CONFIG_DIR"
  info "Deleted $CONFIG_DIR"
fi

read -r -p "Uninstall global openclaw npm package? [y/N] " ans2
if [[ "${ans2,,}" == "y" ]]; then
  export NVM_DIR="$HOME/.nvm"
  # shellcheck source=/dev/null
  [[ -s "$NVM_DIR/nvm.sh" ]] && source "$NVM_DIR/nvm.sh"
  npm uninstall -g openclaw 2>/dev/null || true
  info "Uninstalled openclaw"
fi

info "Done. OpenClaw config at ~/.openclaw was left in place."
