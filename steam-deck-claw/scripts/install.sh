#!/usr/bin/env bash
# Steam Deck Claw — one-shot installer for SteamOS Desktop Mode.
# Installs Node (via nvm), OpenClaw, Ollama Cloud config, and a desktop launcher.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$SCRIPT_DIR"
CONFIG_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/steam-deck-claw"
OPENCLAW_DIR="$HOME/.openclaw"
NODE_MIN_MAJOR=22

info()  { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
warn()  { printf '\033[1;33m!!>\033[0m %s\n' "$*"; }
error() { printf '\033[1;31mERR>\033[0m %s\n' "$*" >&2; exit 1; }

require_desktop_mode() {
  if [[ -z "${DISPLAY:-}" && -z "${WAYLAND_DISPLAY:-}" ]]; then
    warn "No DISPLAY or WAYLAND_DISPLAY detected."
    warn "Switch to Steam Deck Desktop Mode, then run this installer again."
    exit 1
  fi
}

install_nvm_node() {
  export NVM_DIR="$HOME/.nvm"
  if [[ ! -s "$NVM_DIR/nvm.sh" ]]; then
    info "Installing nvm (survives SteamOS updates better than system Node)..."
    curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
  fi
  # shellcheck source=/dev/null
  source "$NVM_DIR/nvm.sh"

  if ! command -v node >/dev/null 2>&1 || [[ "$(node -p 'process.versions.node.split(".")[0]')" -lt "$NODE_MIN_MAJOR" ]]; then
    info "Installing Node.js 22 LTS..."
    nvm install 22
    nvm alias default 22
  fi

  info "Node $(node -v) · npm $(npm -v)"
}

install_openclaw() {
  info "Installing OpenClaw globally..."
  npm install -g openclaw@latest
  command -v openclaw >/dev/null 2>&1 || error "openclaw not found on PATH after install. Open a new terminal and retry."
}

install_desktop_deps() {
  info "Checking optional desktop helpers..."
  if command -v pacman >/dev/null 2>&1; then
    local missing=()
    for pkg in wmctrl xdotool; do
      pacman -Q "$pkg" &>/dev/null || missing+=("$pkg")
    done
    if ((${#missing[@]})); then
      warn "Optional packages not installed: ${missing[*]}"
      warn "Install with: sudo pacman -S ${missing[*]}"
      warn "(Helps the claw focus windows and automate the desktop.)"
    fi
  fi
}

setup_dirs_and_skill() {
  mkdir -p "$CONFIG_DIR" "$OPENCLAW_DIR/workspace/skills"
  chmod 700 "$CONFIG_DIR"

  if [[ ! -f "$CONFIG_DIR/.env" ]]; then
    cp "$REPO_ROOT/.env.example" "$CONFIG_DIR/.env"
    chmod 600 "$CONFIG_DIR/.env"
    info "Created $CONFIG_DIR/.env — add your Ollama Cloud API key there."
  else
    info "Keeping existing $CONFIG_DIR/.env"
  fi

  cp -R "$REPO_ROOT/skills/steam-deck-desktop" "$OPENCLAW_DIR/workspace/skills/"
  info "Installed steam-deck-desktop skill"
}

install_launcher() {
  local apps_dir="${XDG_DATA_HOME:-$HOME/.local/share}/applications"
  mkdir -p "$apps_dir"
  sed "s|@INSTALL_DIR@|$REPO_ROOT|g" "$REPO_ROOT/desktop/Steam-Deck-Claw.desktop" \
    > "$apps_dir/steam-deck-claw.desktop"
  chmod +x "$apps_dir/steam-deck-claw.desktop"
  info "Desktop launcher installed: $apps_dir/steam-deck-claw.desktop"
}

enable_lingering() {
  if command -v loginctl >/dev/null 2>&1; then
    loginctl enable-linger "$USER" 2>/dev/null || true
    info "Enabled loginctl linger (keeps services alive in Game Mode)."
  fi
}

main() {
  info "Steam Deck Claw installer"
  require_desktop_mode
  install_nvm_node
  install_openclaw
  install_desktop_deps
  setup_dirs_and_skill
  bash "$REPO_ROOT/scripts/configure.sh"
  install_launcher
  enable_lingering

  echo
  info "Installation complete!"
  echo
  echo "  Next steps:"
  echo "  1. Edit $CONFIG_DIR/.env and set OLLAMA_API_KEY"
  echo "     Get a key: https://ollama.com/settings/keys"
  echo "  2. Run: $REPO_ROOT/scripts/launch.sh"
  echo "     Or find 'Steam Deck Claw' in your KDE app menu."
  echo
  echo "  Gateway UI: http://127.0.0.1:18789/"
  echo "  Token saved in: $CONFIG_DIR/gateway.token"
  echo
}

main "$@"
