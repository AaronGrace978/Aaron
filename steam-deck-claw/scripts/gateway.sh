#!/usr/bin/env bash
# Wrapper for systemd — loads nvm, env, and starts the OpenClaw gateway.
set -euo pipefail

CONFIG_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/steam-deck-claw"
export NVM_DIR="$HOME/.nvm"
if [[ -s "$NVM_DIR/nvm.sh" ]]; then
  # shellcheck source=/dev/null
  source "$NVM_DIR/nvm.sh"
fi

if [[ -f "$CONFIG_DIR/.env" ]]; then
  set -a
  # shellcheck source=/dev/null
  source "$CONFIG_DIR/.env"
  set +a
fi

exec openclaw gateway --port 18789
