# Unified Chat — Monorepo

Monorepo for the **Unified Chat** service (API + document library + demo) and consumer apps that use the shared **unified-chat** widget.

## Structure

- **`packages/unified-chat`** — Self-contained React chat component and types. Consumer apps depend on this package.
- **`apps/unified-chat-service`** — Next.js app: chat API, document library (`/library`), and demo page. This is the “backend” and admin UI.
- **`apps/minimal-pomodoro`** — Example consumer app: minimal Pomodoro timer + floating chat that calls the service.

## Getting started

From the repo root:

```bash
npm install
npm run dev          # runs the chat service on http://localhost:3000
npm run dev:pomodoro # runs Minimal Pomodoro on http://localhost:3001
```

To run the service you need Postgres and (for RAG) GCP Vertex AI. See below.

## Chat service (`apps/unified-chat-service`)

- **Local:** `npm run dev` from root (or `cd apps/unified-chat-service && npm run dev`). Opens [http://localhost:3000](http://localhost:3000): demo page + `/library` for projects and document uploads.
- **Env:** Create `apps/unified-chat-service/.env.local` with `POSTGRES_URL` and (optional) GCP credentials. For **CORS** (when a consumer app on another origin calls the API), set **`ALLOWED_ORIGINS`** to a comma-separated list, e.g. `http://localhost:3001,https://minimal-pomodoro.vercel.app`.

### GCP Vertex AI (Gemini)

- **Local:** Put a GCP service account key JSON at the service app root or set `GOOGLE_APPLICATION_CREDENTIALS`. Do not commit the key (add to `.gitignore`).
- **Vercel:** Set **`GCP_CREDENTIALS_JSON`** to the full contents of the service account JSON. Optionally **`GCP_PROJECT_ID`** and **`VERTEX_AI_LOCATION`** (default `us-central1`).

### Postgres + pgvector

- **Local:** From repo root run `make up` (Docker). Then set `POSTGRES_URL` in `apps/unified-chat-service/.env.local` (e.g. `make db-url` and copy the line). With the service running, run `make init-db` once (or `curl -X POST http://localhost:3000/api/init-db`).
- **Deployed:** Use Vercel Postgres or Neon; set **`POSTGRES_URL`** and call **`POST /api/init-db`** once after first deploy.

## Minimal Pomodoro (`apps/minimal-pomodoro`)

Example consumer app: work/break timer and a floating chat that uses the unified-chat service.

- **Env (optional):** In `apps/minimal-pomodoro/.env.local`:
  - **`NEXT_PUBLIC_CHAT_SERVICE_URL`** — Base URL of the chat service (e.g. `http://localhost:3000` or `https://your-service.vercel.app`).
  - **`NEXT_PUBLIC_POMODORO_PRODUCT_ID`** — Project UUID for “Minimal Pomodoro” from the document library. Create the project in `/library`, upload the Pomodoro docs, and copy the project ID.

If these are not set, the timer still works; the chat widget is simply not rendered.

## Deploying to Vercel

- **Chat service:** Create a Vercel project with **Root Directory** = `apps/unified-chat-service`. Set env vars (e.g. `POSTGRES_URL`, `GCP_CREDENTIALS_JSON`, `ALLOWED_ORIGINS`).
- **Minimal Pomodoro:** Create another Vercel project with **Root Directory** = `apps/minimal-pomodoro`. Set `NEXT_PUBLIC_CHAT_SERVICE_URL` and `NEXT_PUBLIC_POMODORO_PRODUCT_ID`, and add the service URL to the service app’s `ALLOWED_ORIGINS`.

## Using the chat widget in your app

Add the workspace package and render the component:

```tsx
import { ChatAssistant } from "unified-chat"

<ChatAssistant
  apiUrl={`${process.env.NEXT_PUBLIC_CHAT_SERVICE_URL}/api/chat`}
  productId={process.env.NEXT_PUBLIC_PRODUCT_ID}
  user={{ id: "user-id", name: "User Name" }}
  displayMode="floating"
  placeholder="Ask about this product..."
  title="Help"
  subtitle="Powered by AI"
  theme={{ primaryColor: "#3b82f6", accentColor: "#10b981" }}
/>
```

Your app must use Tailwind and the same CSS variable names (e.g. `--primary`, `--background`) or the widget will pick up your theme. See `apps/minimal-pomodoro` for a minimal setup.

## Other commands

- **Root:** `npm run build` — builds all workspaces that define a build script.
- **Service:** From `apps/unified-chat-service`, `make up` / `make down` / `make init-db` / `make logs` for local Postgres (see **Makefile**).
