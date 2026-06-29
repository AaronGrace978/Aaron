#!/usr/bin/env bash
# Apply Ollama Cloud settings and write ~/.openclaw/openclaw.json5
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CONFIG_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/steam-deck-claw"
OPENCLAW_CONFIG="${OPENCLAW_CONFIG:-$HOME/.openclaw/openclaw.json5}"
TEMPLATE="$REPO_ROOT/config/openclaw.steam-deck.json5"
ENV_FILE="$CONFIG_DIR/.env"
TOKEN_FILE="$CONFIG_DIR/gateway.token"
DEFAULT_MODEL="${STEAM_DECK_CLAW_MODEL:-ollama-cloud/kimi-k2.5:cloud}"

info()  { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
warn()  { printf '\033[1;33m!!>\033[0m %s\n' "$*"; }
error() { printf '\033[1;31mERR>\033[0m %s\n' "$*" >&2; exit 1; }

load_env() {
  if [[ -f "$ENV_FILE" ]]; then
    set -a
    # shellcheck source=/dev/null
    source "$ENV_FILE"
    set +a
  fi
}

ensure_gateway_token() {
  if [[ -f "$TOKEN_FILE" ]]; then
    STEAM_DECK_CLAW_GATEWAY_TOKEN="$(tr -d '[:space:]' < "$TOKEN_FILE")"
  else
    STEAM_DECK_CLAW_GATEWAY_TOKEN="$(openssl rand -hex 24 2>/dev/null || head -c 24 /dev/urandom | od -An -tx1 | tr -d ' \n')"
    printf '%s' "$STEAM_DECK_CLAW_GATEWAY_TOKEN" > "$TOKEN_FILE"
    chmod 600 "$TOKEN_FILE"
    info "Generated gateway token → $TOKEN_FILE"
  fi
  export STEAM_DECK_CLAW_GATEWAY_TOKEN
}

write_openclaw_config() {
  mkdir -p "$(dirname "$OPENCLAW_CONFIG")"
  local tmp
  tmp="$(mktemp)"

  sed \
    -e "s|\$OLLAMA_API_KEY|${OLLAMA_API_KEY:-}|g" \
    -e "s|\$STEAM_DECK_CLAW_GATEWAY_TOKEN|${STEAM_DECK_CLAW_GATEWAY_TOKEN}|g" \
    -e "s|\$STEAM_DECK_CLAW_MODEL|${STEAM_DECK_CLAW_MODEL:-$DEFAULT_MODEL}|g" \
    "$TEMPLATE" > "$tmp"

  if [[ -f "$OPENCLAW_CONFIG" ]]; then
    cp "$OPENCLAW_CONFIG" "${OPENCLAW_CONFIG}.bak.$(date +%Y%m%d%H%M%S)"
    warn "Backed up existing config"
  fi

  mv "$tmp" "$OPENCLAW_CONFIG"
  chmod 600 "$OPENCLAW_CONFIG"
  info "Wrote $OPENCLAW_CONFIG"
}

install_systemd_service() {
  local unit_dir="$HOME/.config/systemd/user"
  mkdir -p "$unit_dir"
  sed \
    -e "s|@REPO_ROOT@|$REPO_ROOT|g" \
    -e "s|@CONFIG_DIR@|$CONFIG_DIR|g" \
    "$REPO_ROOT/systemd/openclaw-gateway.service" > "$unit_dir/openclaw-gateway.service"

  systemctl --user daemon-reload
  systemctl --user enable openclaw-gateway.service 2>/dev/null || true
  info "Installed systemd user service: openclaw-gateway.service"
}

run_openclaw_onboard() {
  if [[ -z "${OLLAMA_API_KEY:-}" ]]; then
    warn "OLLAMA_API_KEY not set — skipping openclaw onboard."
    warn "Set your key in $ENV_FILE, then run this script again."
    return 0
  fi

  export NVM_DIR="$HOME/.nvm"
  if [[ -s "$NVM_DIR/nvm.sh" ]]; then
    # shellcheck source=/dev/null
    source "$NVM_DIR/nvm.sh"
  fi

  if command -v openclaw >/dev/null 2>&1; then
    info "Configuring Ollama Cloud provider..."
    openclaw onboard --non-interactive \
      --auth-choice ollama-cloud \
      --accept-risk 2>/dev/null || warn "openclaw onboard returned non-zero (config file may still work)"

    openclaw models set "${STEAM_DECK_CLAW_MODEL:-$DEFAULT_MODEL}" 2>/dev/null \
      || warn "Could not set default model — check your API key and run: openclaw models list --provider ollama-cloud"
  fi
}

main() {
  load_env
  ensure_gateway_token
  write_openclaw_config
  install_systemd_service
  run_openclaw_onboard
  info "Configuration complete."
}

main "$@"
