# Steam Deck Claw

A **one-click AI claw** for your Steam Deck Desktop Mode — talk to it in the browser, and it helps you navigate KDE Plasma, run commands, and get things done.

Powered by [OpenClaw](https://openclaw.ai) + [Ollama Cloud](https://ollama.com/cloud). Your API key stays on your Deck; the gateway only listens on `127.0.0.1`.

## What you get

- **Chat UI** at `http://127.0.0.1:18789/` — open it from the KDE app menu or the desktop launcher
- **Ollama Cloud** — no local GPU needed; uses models like `kimi-k2.5:cloud` hosted by Ollama
- **Desktop skill** — tuned for SteamOS / KDE shortcuts and safe shell helpers
- **Security defaults** — loopback-only gateway, token auth, exec allowlist with approval prompts
- **Background service** — keeps running when you switch back to Game Mode (with `loginctl linger`)

## Requirements

- Steam Deck in **Desktop Mode** (not Game Mode)
- Wi-Fi connection
- Free [Ollama Cloud API key](https://ollama.com/settings/keys) (Ollama account required)

## Quick install

```bash
# Clone this repo (or download the steam-deck-claw folder)
git clone https://github.com/AaronGrace978/Aaron.git
cd Aaron/steam-deck-claw

# Run the installer
bash scripts/install.sh
```

Then add your API key:

```bash
nano ~/.config/steam-deck-claw/.env
# Set: OLLAMA_API_KEY=your_key_here
```

Re-run configure and launch:

```bash
bash scripts/configure.sh
bash scripts/launch.sh
```

Or click **Steam Deck Claw** in the KDE application menu.

## How to use it

1. Switch to **Desktop Mode** on your Steam Deck.
2. Launch **Steam Deck Claw** from the app menu.
3. Your browser opens the chat UI — type what you want, e.g.:
   - "Open the file manager"
   - "What's using my disk space?"
   - "Help me install Firefox from Discover"
4. The claw runs commands and guides you step by step.

### Voice / Talk

OpenClaw's Control UI supports browser-based Talk on supported models. Check the **Talk** tab in the UI after launching.

## Security

This setup is designed to be **safe by default**:

| Setting | What it does |
|---------|----------------|
| `gateway.bind: loopback` | Only your Deck can reach the gateway (not the network) |
| Token auth | Random token generated at install; required for the UI |
| API key in `~/.config/steam-deck-claw/.env` | `chmod 600` — not committed to git |
| Exec allowlist + ask on miss | Shell commands need approval unless pre-approved |
| Sandboxed non-main sessions | Extra isolation for spawned agent sessions |
| Denied tools | Browser automation, Discord, cron, etc. disabled by default |

**Your Ollama API key** is sent only to `https://ollama.com` — never to third parties.

To tighten further, edit `~/.openclaw/openclaw.json5` and reduce `agents.defaults.tools.allow`.

## Change the model

List available cloud models:

```bash
openclaw models list --provider ollama-cloud
```

Set a different default in `~/.config/steam-deck-claw/.env`:

```bash
STEAM_DECK_CLAW_MODEL=ollama-cloud/glm-5.1:cloud
```

Then run `bash scripts/configure.sh`.

## Background service

```bash
# Start / stop / status
systemctl --user start openclaw-gateway
systemctl --user stop openclaw-gateway
systemctl --user status openclaw-gateway

# Logs
journalctl --user -u openclaw-gateway -f
```

Enable at login:

```bash
systemctl --user enable openclaw-gateway
```

## Uninstall

```bash
bash scripts/uninstall.sh
```

## Troubleshooting

**"OLLAMA_API_KEY is empty"**  
Add your key to `~/.config/steam-deck-claw/.env` and run `scripts/configure.sh`.

**Gateway won't start**  
```bash
journalctl --user -u openclaw-gateway -n 50
openclaw doctor --fix
```

**`openclaw: command not found`**  
Open a new terminal (nvm hooks) or run:
```bash
source ~/.nvm/nvm.sh
```

**Model errors**  
Verify your key works:
```bash
curl -s https://ollama.com/api/tags -H "Authorization: Bearer $OLLAMA_API_KEY" | head
```

**Desktop automation doesn't click things**  
SteamOS may use Wayland — the claw uses shell/KDE commands instead of mouse automation. Install optional helpers: `sudo pacman -S wmctrl xdotool`.

## What this is (and isn't)

- **Is:** An installer + config kit for OpenClaw on Steam Deck with Ollama Cloud
- **Isn't:** A fork of OpenClaw — you get the real upstream `openclaw` npm package
- **Isn't:** A Game Mode overlay — use Desktop Mode for the chat UI

## Links

- [OpenClaw docs](https://docs.openclaw.ai)
- [Ollama Cloud setup for OpenClaw](https://docs.openclaw.ai/providers/ollama-cloud)
- [Ollama API keys](https://ollama.com/settings/keys)

## License

MIT — same as the parent repo. OpenClaw has its own license.
