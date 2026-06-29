#!/usr/bin/env bash
# Start the OpenClaw gateway and open the chat UI in your browser.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CONFIG_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/steam-deck-claw"
GATEWAY_URL="http://127.0.0.1:18789/"
TOKEN_FILE="$CONFIG_DIR/gateway.token"
ENV_FILE="$CONFIG_DIR/.env"

info()  { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
warn()  { printf '\033[1;33m!!>\033[0m %s\n' "$*"; }
error() { printf '\033[1;31mERR>\033[0m %s\n' "$*" >&2; exit 1; }

load_node() {
  export NVM_DIR="$HOME/.nvm"
  if [[ -s "$NVM_DIR/nvm.sh" ]]; then
    # shellcheck source=/dev/null
    source "$NVM_DIR/nvm.sh"
  fi
  command -v openclaw >/dev/null 2>&1 || error "openclaw not installed. Run: $REPO_ROOT/scripts/install.sh"
}

check_api_key() {
  if [[ -f "$ENV_FILE" ]]; then
    set -a
    # shellcheck source=/dev/null
    source "$ENV_FILE"
    set +a
  fi
  if [[ -z "${OLLAMA_API_KEY:-}" ]]; then
    warn "OLLAMA_API_KEY is empty."
    warn "Edit $ENV_FILE and add your key from https://ollama.com/settings/keys"
    warn "Then run: $REPO_ROOT/scripts/configure.sh"
    exit 1
  fi
  export OLLAMA_API_KEY
}

ensure_config() {
  if [[ ! -f "$HOME/.openclaw/openclaw.json5" ]]; then
    bash "$REPO_ROOT/scripts/configure.sh"
  fi
}

start_gateway() {
  if curl -fsS -o /dev/null "$GATEWAY_URL" 2>/dev/null; then
    info "Gateway already running at $GATEWAY_URL"
    return 0
  fi

  info "Starting OpenClaw gateway..."
  systemctl --user start openclaw-gateway.service 2>/dev/null || {
    # Foreground fallback if systemd unit is missing
    nohup openclaw gateway --port 18789 >"$CONFIG_DIR/gateway.log" 2>&1 &
    disown
  }

  for _ in $(seq 1 30); do
    if curl -fsS -o /dev/null "$GATEWAY_URL" 2>/dev/null; then
      info "Gateway ready."
      return 0
    fi
    sleep 1
  done
  error "Gateway did not start. Check: journalctl --user -u openclaw-gateway -n 50"
}

open_ui() {
  local token=""
  if [[ -f "$TOKEN_FILE" ]]; then
    token="$(tr -d '[:space:]' < "$TOKEN_FILE")"
  fi

  local url="$GATEWAY_URL"
  if [[ -n "$token" ]]; then
    url="${GATEWAY_URL}?token=${token}"
  fi

  info "Opening chat UI..."
  if command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$url" >/dev/null 2>&1 &
  elif command -v kde-open >/dev/null 2>&1; then
    kde-open "$url" >/dev/null 2>&1 &
  else
    info "Open this URL in your browser: $url"
  fi
}

main() {
  load_node
  check_api_key
  ensure_config
  start_gateway
  open_ui
  echo
  info "Talk to your claw at $GATEWAY_URL"
  info "Stop background service: systemctl --user stop openclaw-gateway"
}

main "$@"
