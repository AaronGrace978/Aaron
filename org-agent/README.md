# org-agent

A lean, batteries-included organization agent that runs locally with Ollama.

## Quickstart

1. Copy `.env.example` to `.env` and adjust as needed.
2. Start Ollama and API with Docker:

```bash
docker compose up -d ollama
ollama pull mistral:7b-instruct
ollama pull nomic-embed-text
docker compose up -d api
```

3. Test the API:

```bash
curl -s -X POST http://localhost:8000/chat -H 'Content-Type: application/json' -d '{"message":"plan my week"}' | jq
```

## Structure

See inline comments in repo tree. Core loop: Plan → Act → Reflect.

## License
MIT
