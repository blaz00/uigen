# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run setup        # Install deps + generate Prisma client + run migrations
npm run dev          # Start dev server with Turbopack at http://localhost:3000
npm run build        # Production build
npm run lint         # ESLint
npm test             # Run Vitest tests
npm test -- path/to/test.ts  # Run a single test file
npm run db:reset     # Reset the SQLite database (destructive)
```

The dev server requires `NODE_OPTIONS='--require ./node-compat.cjs'` (already baked into the npm script) due to Node.js compatibility shims for the Prisma/Next.js combination.

## Environment

Copy `.env` and set `ANTHROPIC_API_KEY` to use real AI generation. Without it, the app runs with `MockLanguageModel` (`src/lib/provider.ts`) which returns hardcoded counter/form/card components — useful for development without API costs.

## Architecture

### Request flow

1. User types in `ChatInterface` → `useChat` hook (Vercel AI SDK) streams to `POST /api/chat`
2. The API route reconstructs a `VirtualFileSystem` from serialized `files` sent with the request, then calls `streamText` with two tools: `str_replace_editor` and `file_manager`
3. The AI uses these tools to create/edit files in the in-memory VFS
4. Tool call results stream back to the client; `FileSystemContext.handleToolCall` applies the same mutations to the client-side VFS
5. `PreviewFrame` watches `refreshTrigger` from the context and re-renders the iframe whenever files change
6. On finish, if the user is authenticated and a `projectId` exists, the serialized VFS + messages are persisted to SQLite via Prisma

### Virtual File System

`VirtualFileSystem` (`src/lib/file-system.ts`) is an in-memory tree. Files are never written to disk. Both server (in the API route) and client (via `FileSystemContext`) maintain their own VFS instances that stay in sync through tool call streaming. The VFS serializes to `Record<string, FileNode>` (JSON-safe) for transport and persistence.

### Live Preview

`PreviewFrame` (`src/components/preview/PreviewFrame.tsx`) renders an `<iframe srcdoc>`. `jsx-transformer.ts` uses `@babel/standalone` to transpile JSX/TSX in-browser, creates blob URL import maps for inter-file imports, and inlines Tailwind CSS via CDN. Entry point resolution prefers `/App.jsx` → `/App.tsx` → `/index.jsx` → `/index.tsx` → `/src/App.jsx`.

### Auth

JWT-based session auth (`src/lib/auth.ts`) using `jose`. Sessions stored in httpOnly cookies (7-day expiry). Anonymous users can generate components; project persistence requires a registered account. Middleware at `src/middleware.ts` only protects `/api/projects` and `/api/filesystem` — the `/api/chat` route is intentionally public.

### AI Tools

- `str_replace_editor` (`src/lib/tools/str-replace.ts`): create, str_replace, insert, view commands — mirrors the Claude computer-use text editor tool interface
- `file_manager` (`src/lib/tools/file-manager.ts`): rename, delete commands

### Data model

SQLite via Prisma. `Project.messages` and `Project.data` are JSON stored as strings (SQLite has no native JSON type). `Project.userId` is nullable to support anonymous project creation (though persistence only saves for authenticated users).

### Key contexts

- `FileSystemContext` — owns the client-side VFS, exposes `handleToolCall` which the chat stream calls on each tool invocation
- `ChatContext` — wraps Vercel AI SDK's `useChat`, manages project ID and anonymous work tracking (`src/lib/anon-work-tracker.ts` uses `sessionStorage` to preserve anonymous work across login flows)
