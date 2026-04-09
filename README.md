# Ice Breaker Game MVP

Web-based facilitator-led board game to energize teams before ideation sessions.

## Tech Stack
- Next.js (App Router, TypeScript)
- Socket.IO for real-time updates
- SQLite + Prisma for persistence

## Local Setup
1. Install dependencies:
   - `npm install`
2. Copy env:
   - `copy .env.example .env`
3. Push schema and seed prompts:
   - `npm run db:push`
   - `npm run db:seed`
4. Run app:
   - `npm run dev`
5. Open:
   - Host: `http://localhost:3000/host`
   - Join fallback: `http://localhost:3000/join`
   - Admin: `http://localhost:3000/admin/prompts` (use `ADMIN_KEY`)

## MVP Features
- Host can create session, choose teams, start/end game.
- QR + short code join flow for participants.
- Captain-only roll per active turn.
- Circular board movement with Move/Talk/Create/Wildcard tiles.
- No scoring, no winner declaration.
- Prompt admin (add, edit via API update flow, enable/disable, filter).
- 30 seeded prompts (10 move, 10 talk, 10 create).

## AWS Deployment Notes
- Deploy as a single Node service (Next.js custom server).
- Persist SQLite file with attached volume for MVP, or move Prisma datasource to managed database later.
- Configure environment variables: `DATABASE_URL`, `ADMIN_KEY`, `PORT`.
