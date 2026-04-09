# Ice Breaker Game MVP

Web-based facilitator-led board game to energize teams before ideation sessions.

## Deliverables checklist (submission)

| Requirement | Status |
|-------------|--------|
| **Runnable local build** | Yes: `npm install` → `.env` → `npm run db:push` → `npm run db:seed` → `npm run dev` |
| **Deployed URL** | Yes — [Live deployment](#live-deployment) |
| **Fully playable end-to-end** | Yes: host creates session → share code/QR → players join → host starts game → captain rolls → host advances turn |
| **Source code** | TypeScript, App Router, `lib/` game engine + Prisma; see **Project layout** (light inline comments, logic in named functions) |
| **Prompt dataset editable in admin UI** | Yes: add prompts, enable/disable, filter by type (see **Managing prompts**; editing *text* of an existing row is not in the UI—disable + add new, or use `PUT /api/admin/prompts/:id`) |
| **README: run, host, prompts, limitations** | This file |

## Tech stack

- **Next.js** (App Router, TypeScript) with a **custom Node server** (`server.mjs`) so **Socket.IO** shares the same HTTP port as the app
- **Socket.IO** for live session updates (with polling fallback)
- **SQLite** + **Prisma** for persistence
- **html5-qrcode** for optional camera / image QR scan on the join page
- **Docker** (optional): root `Dockerfile` + `docker-entrypoint.sh` for platforms like Render

## Live deployment

**Deployed app (Render):** [https://ice-breaker-game.onrender.com/](https://ice-breaker-game.onrender.com/)

Use the same routes as locally: [`/host`](https://ice-breaker-game.onrender.com/host), [`/join`](https://ice-breaker-game.onrender.com/join), [`/admin`](https://ice-breaker-game.onrender.com/admin), etc.

**Change prompts on the live app:** open **[Prompt admin](https://ice-breaker-game.onrender.com/admin/prompts)** — enter your **`ADMIN_KEY`** (from Render → *Environment*), then add prompts, enable/disable, and filter. (To change *text* of an existing row, use **`PUT /api/admin/prompts/{id}`** with `x-admin-key`, or add a new prompt and disable the old one.)

**`ADMIN_KEY` environment variable** (set in the host’s env, e.g. Render → *Environment*): this single secret unlocks both **prompt management** and **read-only database views** in the browser—no separate SQL client required.

| What | Where | How to authenticate |
|------|--------|----------------------|
| **Prompts** (add, enable/disable, filter) | [ice-breaker-game.onrender.com/admin/prompts](https://ice-breaker-game.onrender.com/admin/prompts) | Enter the value of `ADMIN_KEY` in the page’s admin key field (find it in .env) |
| **Database tables** (sessions, teams, prompts, history) | `/admin/data` | Same `ADMIN_KEY` in the field, then **Load data** |
| **Admin hub** (links + hints) | `/admin` | — |
| **JSON** (e.g. sessions list) | `/api/admin/sessions?key=...` | Query param **`key`** must equal `ADMIN_KEY` |

Locally, put the same secret in `.env` as `ADMIN_KEY=...`.

## Local setup

1. **Install dependencies:** `npm install`
2. **Environment:** copy `.env.example` to `.env` and set at least `DATABASE_URL` and `ADMIN_KEY` (e.g. `copy .env.example .env` on Windows).
3. **Database:** `npm run db:push` then `npm run db:seed`
4. **Run:** `npm run dev` (starts `node server.mjs`, which loads `.env` via `@next/env`)

### Useful URLs

**Local** (default dev port `3000`):

| Page | URL |
|------|-----|
| Home | http://localhost:3000/ |
| Host | http://localhost:3000/host |
| Join (type code or scan QR) | http://localhost:3000/join |
| Player | http://localhost:3000/session/{CODE}/player |
| Admin hub | http://localhost:3000/admin |
| Prompt admin | http://localhost:3000/admin/prompts |
| DB overview | http://localhost:3000/admin/data |

**Deployed** — use the same paths on **`https://ice-breaker-game.onrender.com`** (e.g. host `https://ice-breaker-game.onrender.com/host`, prompts `https://ice-breaker-game.onrender.com/admin/prompts`, player `https://ice-breaker-game.onrender.com/session/{CODE}/player`).

On admin pages, enter the same value as **`ADMIN_KEY`** from `.env` (local) or from the host’s environment (Render). That unlocks **prompts** and **DB overview**. For JSON APIs use query **`?key=YOUR_SECRET`**, not `?ADMIN_KEY=`.

## How to host a game (facilitator)

1. Open **Host** (`/host`), enter one team name per line, click **Create Session**.
2. Wait for the URL to include **`?code=...`**. Bookmark or keep this tab—reload returns you to the same room.
3. Share the join link or open **Show QR (with code)** so players can scan or read the code.
4. Players open **Join** (`/join`) or the player link `/session/{CODE}/player`, pick a team (first joiner per team is **captain**).
5. When everyone is ready, click **Start Game** on the host console.
6. The **captain** of the team whose turn it is taps **Roll Dice** (wildcard tile needs a category selected first). The host clicks **Next Turn** after the round is done.
7. Use **End Game** when finished, or **Leave session / create another** to start a new room.

## Managing prompts (admin UI)

1. Set **`ADMIN_KEY`** in `.env` (production: host env vars, e.g. Render).
2. Open the prompt admin UI — **production:** [https://ice-breaker-game.onrender.com/admin/prompts](https://ice-breaker-game.onrender.com/admin/prompts) · **local:** http://localhost:3000/admin/prompts — enter the admin key; the list loads automatically (use the type filter to refresh or narrow results).
3. **Add:** fill text + type (MOVE / TALK / CREATE / WILDCARD), click **Add**.
4. **Filter:** use the dropdown (All / Move / Talk / Create / Wildcard).
5. **Enable / Disable:** use the button on each card (disabled prompts are not drawn for rolls).
6. **Change wording** of an existing prompt: there is no text field in the UI—either add a new prompt and disable the old one, or call **`PUT /api/admin/prompts/{id}`** with `x-admin-key` and JSON body `{ text, type, enabled }`.

Optional: **`/admin/data`** (same key) shows read-only session/team/prompt tables for debugging.

## Project layout

- `app/` — pages and `app/api/*` route handlers  
- `lib/gameEngine.ts` — board, rolls, turns, prompts  
- `lib/prisma.ts`, `prisma/` — schema + seed  
- `server.mjs` — Next + Socket.IO on one port  
- `components/` — shared board / dice UI  

## MVP features

- Host creates a session (team names), **Start / Next turn / End** game.
- **Host URL keeps the room:** after create, the app uses `/host?code=SESSIONCODE` so reload or bookmark restores the same session. Use **Leave session** to start fresh.
- **Join:** type a code or use **Scan QR** (camera or image); validates the session before redirecting.
- **QR for players:** host uses **Show QR (with code)** (modal) — not shown until opened.
- **Board:** each team has a **token** (by team creation order); **last dice roll** per team is shown for everyone.
- Captain-only **roll** on the active team’s turn; circular board with Move / Talk / Create / Wildcard tiles.
- No scoring or winner declaration.
- **Prompt admin:** add / toggle / filter prompts; **admin data** page for read-only DB tables.
- **30** seeded prompts (10 move, 10 talk, 10 create).

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server (`node server.mjs`) |
| `npm run build` | Production Next build |
| `npm start` | Production (`node server.mjs`, set `NODE_ENV=production`) |
| `npm run db:push` | Apply Prisma schema to the DB |
| `npm run db:seed` | Seed prompts |

## Docker

```bash
docker build -t ice-breaker .
docker run --rm -p 3000:3000 -e DATABASE_URL=file:./prisma/prod.db -e ADMIN_KEY=your-secret ice-breaker
```

The entrypoint runs `prisma db push`, `prisma db seed`, then `node server.mjs`. **Do not** set `NODE_ENV=production` before `npm ci` in the image build (devDependencies are required for `next build`).

## Deployment notes

- Deploy as **one long-lived Node process** (custom server + WebSockets). Typical **PaaS** options: Render, Fly.io, Railway, a VPS, etc. **Vercel-only** is not a good fit for this Socket.IO setup.
- Set **`DATABASE_URL`**, **`ADMIN_KEY`**, and **`PORT`** (many hosts inject `PORT` automatically).
- After schema changes, ensure **`prisma db push`** (or migrations) runs against production.
- **SQLite** on ephemeral disks loses data on redeploy unless you use a volume or switch to a managed DB (e.g. Postgres).

## AWS (or any VM)

- Run the same **Docker** image or `npm ci` → `npm run build` → `npm start` behind a process manager.
- Use a **persistent volume** for SQLite, or point `DATABASE_URL` at a managed database.

## Known limitations and assumptions

- **No scoring or winner** — facilitator ends when the activity should stop.
- **Captain model** — the first device to join a team becomes captain and is the only one who can roll; clearing site data changes client id and can lock that team unless another flow is added.
- **SQLite** — fine for local/demo; production without a disk loses data on redeploy unless you attach storage or use Postgres.
- **Real-time** — Socket.IO + 3s polling fallback; brief delay possible if the socket disconnects.
- **Join QR** — camera needs HTTPS (or localhost) and user permission; some browsers work better with **Choose QR image**.
- **Admin security** — `ADMIN_KEY` is a single shared secret; protect the env var and use a strong value in production.
- **Wildcard prompts** — board can land on WILDCARD; prompt *text* still comes from the **MOVE/TALK/CREATE** pools (wildcard choice picks the type). WILDCARD-type rows in admin are for data consistency, not a separate deck in the engine.
- **Host must start** — rolls are rejected until status is **ACTIVE** (`Start Game`).
