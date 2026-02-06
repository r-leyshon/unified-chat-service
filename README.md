This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Chat assistant & Vertex AI (Gemini 2.5 Flash)

Completions use **GCP Vertex AI Gemini 2.5 Flash**. Credentials are loaded in an environment-aware way:

- **Local:** Place a GCP service account key JSON at the project root (e.g. `rich-experiments-6e037a3981c5.json`) or set `GOOGLE_APPLICATION_CREDENTIALS` to its path. Do not commit the key file (it is in `.gitignore`).
- **Vercel:** Set the env var **`GCP_CREDENTIALS_JSON`** to the **full contents** of your service account JSON (paste the whole file as one string). Optionally set **`GCP_PROJECT_ID`** and **`VERTEX_AI_LOCATION`** (default `us-central1`).

Enable the Vertex AI API for your GCP project and grant the service account appropriate Vertex AI permissions.

## Document Library (Postgres + pgvector)

The **Document Library** (`/library`) lets you create projects (e.g. per product or app) and upload **.pdf** or **.txt** files. Documents are chunked, embedded with Vertex AI **text-embedding-005**, and stored in Postgres with **pgvector** for RAG.

### Local Postgres (development)

You can use a **local Postgres** instance before deploying. The repo includes container recipes:

1. **Start Postgres + pgvector** (Docker):
   ```bash
   make up
   # or: docker compose up -d
   ```
   This starts a Postgres container with the `pgvector` extension and a `unified_chat` database (user/password: `postgres`/`postgres`).

2. **Set `POSTGRES_URL` in `.env.local`**:
   ```bash
   make db-url
   ```
   Copy the printed line into `.env.local`, or add:
   ```bash
   POSTGRES_URL="postgresql://postgres:postgres@localhost:5432/unified_chat?sslmode=disable"
   ```

3. **Init schema:** With the app running (`npm run dev`), run once:
   ```bash
   make init-db
   # or: curl -X POST http://localhost:3000/api/init-db
   ```
   This enables the `vector` extension and creates the `projects`, `documents`, and `document_chunks` tables.

4. Open **[/library](http://localhost:3000/library)**: create a project, select it, and upload files.

**Other commands:** `make down` — stop containers; `make logs` — follow Postgres logs. See the **Makefile** for all targets.

### Deployed (Vercel / Neon)

- **Vercel Postgres:** Create a database in the Vercel dashboard and add **`POSTGRES_URL`** to your project env. Then call **`POST /api/init-db`** once (e.g. after first deploy).
- **Neon:** Create a project at [Neon](https://neon.tech), add **`POSTGRES_URL`** (connection string), and run **`POST /api/init-db`** once. Same code works; `@vercel/postgres` is deprecated but the client works with any Postgres URL, including Neon.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
