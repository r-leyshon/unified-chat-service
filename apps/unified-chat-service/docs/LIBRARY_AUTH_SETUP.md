# Document Library Authentication Setup

The document library (`/library`) is protected by GitHub OAuth. Only users whose GitHub usernames are listed in `LIBRARY_ALLOWED_GITHUB_USERNAMES` can sign in and manage projects and documents.

## Quick setup (local and Vercel)

### 1. Create a GitHub OAuth App

1. Go to [GitHub → Settings → Developer settings → OAuth Apps](https://github.com/settings/developers)
2. Click **"New OAuth App"**
3. Fill in:
   - **Application name:** e.g. `Unified Chat Library` (or your project name)
   - **Homepage URL:**
     - Local: `http://localhost:3000`
     - Production: `https://your-app.vercel.app` (or your deployed URL)
   - **Authorization callback URL:**
     - Local: `http://localhost:3000/api/auth/callback/github`
     - Production: `https://your-app.vercel.app/api/auth/callback/github`
4. Click **"Register application"**
5. Generate a **Client Secret** and copy both the **Client ID** and **Client Secret**

For local and production, you can either:
- Create two OAuth Apps (one for localhost, one for production), or
- Use one app and add multiple callback URLs (GitHub allows multiple callback URLs for the same OAuth App)

### 2. Generate AUTH_SECRET

Run:

```bash
npx auth secret
```

This adds `AUTH_SECRET` to your `.env.local`. Copy the value for use in Vercel.

### 3. Add environment variables

In `apps/unified-chat-service/.env.local` (local) and Vercel project settings (production), add:

| Variable | Description |
|----------|-------------|
| `AUTH_SECRET` | Required. Random string for token encryption. Run `npx auth secret` to generate. |
| `AUTH_GITHUB_ID` | GitHub OAuth App Client ID |
| `AUTH_GITHUB_SECRET` | GitHub OAuth App Client Secret |
| `LIBRARY_ALLOWED_GITHUB_USERNAMES` | Comma-separated list of GitHub usernames allowed to manage the library (e.g. `r-leyshon` or `user1,user2`). Case-insensitive. If empty, any authenticated GitHub user can access (not recommended for production). |

**Example `.env.local`:**

```bash
# Existing vars (POSTGRES_URL, ALLOWED_ORIGINS, etc.)
AUTH_SECRET="your-generated-secret-from-npx-auth-secret"
AUTH_GITHUB_ID="your-github-oauth-client-id"
AUTH_GITHUB_SECRET="your-github-oauth-client-secret"
LIBRARY_ALLOWED_GITHUB_USERNAMES="r-leyshon"
```

### 4. Production (Vercel)

1. In your Vercel project → **Settings** → **Environment Variables**, add the same variables
2. For `AUTH_URL`, set your production URL (e.g. `https://your-app.vercel.app`) if Auth.js does not auto-detect it. Vercel usually sets this via `VERCEL_URL`.
3. Ensure your GitHub OAuth App callback URL includes your production domain

## Flow

- Unauthenticated users visiting `/library` are redirected to `/library/signin`
- They click "Sign in with GitHub" and complete OAuth
- If their GitHub username is in `LIBRARY_ALLOWED_GITHUB_USERNAMES`, they can access the library
- If not, they see "Access denied"
- **Read-only APIs** (GET projects, documents, document content) remain public so consumer apps and the chat can fetch data
- **Write operations** (create/update/delete projects, upload/edit/delete documents) require authentication
