# Container and DB setup for local development.
# Requires: Docker and Docker Compose.

.PHONY: up down db-url init-db logs

# Start Postgres + pgvector in the background.
up:
	docker compose up -d

# Stop and remove containers (data volume is preserved).
down:
	docker compose down

# Print the local Postgres URL to add to .env.local.
db-url:
	@echo 'POSTGRES_URL="postgresql://postgres:postgres@localhost:5432/unified_chat?sslmode=disable"'

# Run schema init (requires app running: npm run dev). Creates vector extension and tables.
init-db:
	curl -s -X POST http://localhost:3000/api/init-db | cat

# Show Postgres logs.
logs:
	docker compose logs -f postgres
