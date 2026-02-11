# Unified Chat — Monorepo

Monorepo for the **Unified Chat** service (API + document library + demo) and consumer apps that use the shared **unified-chat** widget.

## Structure

- **`packages/unified-chat`** — Self-contained React chat component and types. Consumer apps depend on this package.
- **`apps/unified-chat-service`** — Next.js app: chat API, document library (`/library`), and demo page. This is the “backend” and admin UI.
- **`apps/minimal-pomodoro`** — Example consumer app: minimal Pomodoro timer + floating chat that calls the service.
- **`apps/unit-converter`** — Unit converter (length) + floating chat. Default styling.
- **`apps/tip-calculator`** — Tip calculator with light/dark mode + floating chat.

## Getting started

From the repo root:

```bash
npm install
npm run dev              # runs the chat service on http://localhost:3000
npm run dev:pomodoro     # Minimal Pomodoro on http://localhost:3001
npm run dev:unit-converter  # Unit Converter on http://localhost:3002
npm run dev:tip-calculator  # Tip Calculator on http://localhost:3003
```

To run the service you need Postgres and (for RAG) GCP Vertex AI. See below.

## Chat service (`apps/unified-chat-service`)

- **Local:** `npm run dev` from root (or `cd apps/unified-chat-service && npm run dev`). Opens [http://localhost:3000](http://localhost:3000): demo page + `/library` for projects and document uploads.
- **Env:** Create `apps/unified-chat-service/.env.local` with `POSTGRES_URL` and (optional) GCP credentials. For **CORS** (when a consumer app on another origin calls the API), set **`ALLOWED_ORIGINS`** to a comma-separated list, e.g. `http://localhost:3001,http://localhost:3002,http://localhost:3003,https://minimal-pomodoro.vercel.app`.
- **Document library auth:** The `/library` page requires GitHub OAuth. See [apps/unified-chat-service/docs/LIBRARY_AUTH_SETUP.md](apps/unified-chat-service/docs/LIBRARY_AUTH_SETUP.md) for creating a GitHub OAuth App and configuring `AUTH_SECRET`, `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`, and `LIBRARY_ALLOWED_GITHUB_USERNAMES`.

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

## Unit Converter (`apps/unit-converter`)

- **Local:** `npm run dev:unit-converter` from root. Opens [http://localhost:3002](http://localhost:3002). Default (neutral) styling.
- **Env (optional):** In `apps/unit-converter/.env.local` set **`NEXT_PUBLIC_CHAT_SERVICE_URL`** and **`NEXT_PUBLIC_UNIT_CONVERTER_PRODUCT_ID`** (create a project in `/library` and copy its ID). Add `http://localhost:3002` to the service **`ALLOWED_ORIGINS`** for CORS.

## Tip Calculator (`apps/tip-calculator`)

- **Local:** `npm run dev:tip-calculator` from root. Opens [http://localhost:3003](http://localhost:3003). Toggle light/dark mode in the top-right; the app and chat widget both follow the theme via CSS variables.
- **Env (optional):** In `apps/tip-calculator/.env.local` set **`NEXT_PUBLIC_CHAT_SERVICE_URL`** and **`NEXT_PUBLIC_TIP_CALCULATOR_PRODUCT_ID`**. Add `http://localhost:3003` to the service **`ALLOWED_ORIGINS`**.

## Deploying to Vercel

- **Chat service:** Create a Vercel project with **Root Directory** = `apps/unified-chat-service`. Set env vars (e.g. `POSTGRES_URL`, `GCP_CREDENTIALS_JSON`, `ALLOWED_ORIGINS`).
- **Consumer apps:** Create Vercel projects with **Root Directory** = `apps/minimal-pomodoro`, `apps/unit-converter`, or `apps/tip-calculator`. Set the app’s `NEXT_PUBLIC_CHAT_SERVICE_URL` and product ID env var (`NEXT_PUBLIC_POMODORO_PRODUCT_ID`, `NEXT_PUBLIC_UNIT_CONVERTER_PRODUCT_ID`, or `NEXT_PUBLIC_TIP_CALCULATOR_PRODUCT_ID`), and add each app’s origin to the service **`ALLOWED_ORIGINS`**.

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

To have chat events show up in the service’s event log (demo page), pass **`eventReportUrl`** (e.g. `https://your-service/api/events`) and optionally **`productName`** so entries are labeled by product.

### Multiple sources and concurrent requests

- **Event log:** Events from the demo and from consumer apps (that set `eventReportUrl`) are sent to **POST /api/events** and shown in the demo event log. The log is persisted in the browser (localStorage) for demo events; events from other origins are stored in memory on the service and polled every few seconds.
- **Chat API:** Each **POST /api/chat** request is independent (no shared session). The service can handle many simultaneous requests from different products; each request is scoped by **product_id** (project) for RAG and responses are streamed per request.

## Other commands

- **Root:** `npm run build` — builds all workspaces that define a build script.
- **Service:** From `apps/unified-chat-service`, `make up` / `make down` / `make init-db` / `make logs` for local Postgres (see **Makefile**).
