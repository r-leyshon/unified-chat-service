# Learnings — Blog Notes for the Unified Chat Service

Notes and reflections from building the Unified Chat service, for use in a future blog post.

---

## 1. Neon Serverless + pgvector: Speeding Up RAG in Serverless

### The Problem

We initially used the standard `pg` (node-postgres) driver with Neon’s Postgres URL. In serverless (Vercel):

- **Connection pooling** doesn’t fit serverless: each function invocation can create new connections, and traditional pools assume long-lived processes.
- **Cold starts** were slower because of TCP connection setup to Postgres.
- **`url.parse` deprecation**: The Node.js `url.parse` used internally by the Postgres client triggered deprecation warnings from the Google SDK.

### The Solution: `@neondatabase/serverless`

We switched to Neon’s serverless driver (`@neondatabase/serverless`) for Neon URLs:

```typescript
import { Pool as NeonPool, neonConfig } from "@neondatabase/serverless"
import { Pool as PgPool } from "pg"

const isNeon = url.includes("neon.tech") || url.includes("neon.db.ondigitalocean.com")

if (isNeon) {
  neonConfig.poolQueryViaFetch = true  // Use HTTP fetch instead of WebSockets
}

const PoolClass = isNeon ? NeonPool : PgPool
const pool = new PoolClass({ connectionString: url })
```

Key points:

1. **`poolQueryViaFetch = true`** — Uses Neon’s HTTP-based query API instead of persistent WebSocket connections. This matches serverless better: no long-lived connections, fewer cold-start issues.
2. **Same API** — The `Pool` interface is compatible with `pg`, so we kept a thin abstraction and swap the implementation based on the connection URL.
3. **Local dev unchanged** — For local Docker Postgres we still use `pg`; the serverless driver is only used when the URL is a Neon URL.

### Takeaway

For RAG and other Postgres workloads on Vercel or similar serverless runtimes, using the Neon serverless driver with HTTP fetch can reduce latency and avoid connection-pooling issues. The abstraction over `pg` vs `@neondatabase/serverless` makes it straightforward to support both local Postgres and Neon in production.

---

## 7. Server-Side Event Registration

### Design

Initially, consumers POSTed events to `POST /api/events`. This required CORS for the events endpoint and extra configuration (`eventReportUrl`). We moved to **server-side registration**: the chat route pushes events (message_sent, search, message_received, error) to the shared store when handling each request. Consumers no longer POST to events; the demo page still fetches via GET /api/events.

### Takeaway

Registering events where the action occurs (in the chat route) simplifies consumer integration—no eventReportUrl, no extra CORS—and ensures events are never missed due to client misconfiguration.

---
