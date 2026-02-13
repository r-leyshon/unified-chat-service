# Quick Start — Using the Unified Chat Service

This guide explains how to add the **Unified Chat** widget to your app when importing the component from [GitHub](https://github.com/r-leyshon/unified-chat-service).

## Prerequisites

- A Next.js (or React) app with **Tailwind CSS**
- The unified-chat-service deployed (or running locally)
- A **product** (project) created in the service’s document library with your docs uploaded

## 1. Install the chat component from GitHub

The package ships **pre-compiled** JavaScript. No custom transpilation, aliases, or `--webpack` workarounds needed.

```bash
npm install git+https://github.com/r-leyshon/unified-chat-service.git#main
```

Or add to `package.json`:

```json
"unified-chat": "github:r-leyshon/unified-chat-service#main"
```

> **Alternative:** Fork the repo and add `unified-chat` as a workspace dependency:  
> `"unified-chat": "file:../../packages/unified-chat"`

## 2. Set environment variables

In your app (e.g. `.env.local`):

| Variable | Description |
|----------|--------------|
| `NEXT_PUBLIC_CHAT_SERVICE_URL` | Base URL of the deployed service (e.g. `https://unified-chat-service-xxx.vercel.app`) |
| `NEXT_PUBLIC_<YOUR_APP>_PRODUCT_ID` | UUID of your project from the document library |

## 3. Add your app’s origin to CORS

In the unified-chat-service project, set `ALLOWED_ORIGINS` to include your app’s origin (no trailing slash):

```
https://your-app.vercel.app,http://localhost:3000
```

## 4. Add the component to your page

```tsx
"use client"

import { ChatAssistant } from "unified-chat"

export default function MyPage() {
  const chatServiceUrl = process.env.NEXT_PUBLIC_CHAT_SERVICE_URL ?? ""
  const productId = process.env.NEXT_PUBLIC_MY_APP_PRODUCT_ID ?? ""

  return (
    <div>
      {/* Your app content */}

      {chatServiceUrl && productId ? (
        <ChatAssistant
          apiUrl={`${chatServiceUrl}/api/chat`}
          productId={productId}
          productName="My App"
          user={{ id: "user-123", name: "User Name" }}
          displayMode="floating"
          placeholder="Ask about this product..."
          title="Help"
          subtitle="Powered by AI"
        />
      ) : null}
    </div>
  )
}
```

## Component props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `apiUrl` | string | Yes | Full URL to `/api/chat` (e.g. `${serviceUrl}/api/chat`) |
| `productId` | string | Yes | Project UUID from the document library |
| `productName` | string | No | Label for event logs |
| `user` | `{ id: string; name?: string }` | No | User identifier and display name |
| `displayMode` | `"floating"` \| `"inline"` | No | Default: `"floating"` |
| `placeholder` | string | No | Input placeholder text |
| `title` | string | No | Chat window title |
| `subtitle` | string | No | Subtitle (e.g. "Powered by AI") |
| `theme` | `{ primaryColor?, accentColor?, ... }` | No | Custom colors and styling |

> Chat events are registered automatically by the service; no `eventReportUrl` needed.

## 5. Tailwind content

Include the package in Tailwind's content scan so its classes (e.g. `w-full`, `sm:w-[380px]`) are generated. Without this, the chat window may render with missing or incorrect styles.

**Tailwind v4** (in `globals.css`):

```css
@source "../node_modules/unified-chat/packages/unified-chat/dist";
```

**Tailwind v3** (in `tailwind.config.ts`):

```ts
content: [
  // ... your existing paths ...
  "./node_modules/unified-chat/packages/unified-chat/dist/**/*.{js,mjs}",
],
```

## 6. Theming and styling

The widget uses Tailwind and CSS variables. If your app defines `--primary`, `--background`, `--foreground`, etc., the chat will follow your theme. You can also override with the `theme` prop:

```tsx
<ChatAssistant
  theme={{
    primaryColor: "#3b82f6",
    accentColor: "#10b981",
    borderRadius: 12,
  }}
  // ... other props
/>
```
