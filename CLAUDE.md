# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Dev Setup

Two terminals required — API and web run independently:

```bash
# Terminal 1 — NestJS API (port 3001)
cd apps/api && npm run dev

# Terminal 2 — Next.js web (port 3000)
cd apps/web && npm run dev
```

Or from the root (runs both via concurrently):
```bash
npm run dev
```

Each app needs its own `.env` file. Copy the root `.env` into both:
- `apps/api/.env` — read by NestJS `ConfigModule`
- `apps/web/.env` — read by Next.js

## Database

Neon (managed Postgres). All Prisma commands run from `apps/api`:

```bash
cd apps/api
npm run db:push      # apply schema changes to Neon (no migration files)
npm run db:seed      # seed 10 doctors + demo patient
npm run db:studio    # open Prisma Studio GUI
```

Demo credentials after seeding:
- Patient: `patient@yourkalinga.com` / `Patient123!`
- Doctor: `dr.reyes@yourkalinga.com` / `Doctor123!`

## Architecture

### Monorepo structure
```
apps/api/   — NestJS backend, deploys to Render
apps/web/   — Next.js 14 frontend, deploys to Vercel
```

### API (`apps/api`)
- Global prefix: `/api` — all endpoints are `/api/*`
- Auth: JWT access tokens (7d) + refresh tokens (30d, bcrypt-hashed in DB). Token stored in `localStorage` as `yk_token`. `@Public()` decorator bypasses the global `JwtAuthGuard`.
- Role guard: `@Roles('DOCTOR')` + `RolesGuard` for doctor-only endpoints
- Notifications: Socket.IO gateway at `/notifications` namespace. `NotificationsService.create()` both persists to DB and pushes to the user's socket via `sendToUser(userId)`. Call this whenever an appointment event occurs.
- AI: Groq API via OpenAI-compatible SDK in `src/ai/`. Results are cached in-memory for 5 minutes per symptom string. Falls back to top-6 doctors by rating if Groq fails.
- File uploads: Cloudinary via `src/uploads/`
- Video: Jitsi room ID (`yourkalinga-{uuid8}`) is generated at booking time and stored on the `Appointment` record

### Web (`apps/web`)
- Route structure: `app/(auth)/` for login/register, `app/patient/` for patient pages, `app/doctor/` for doctor pages. **Important:** these are regular folders (not route groups) so URLs are `/patient/dashboard`, `/doctor/dashboard`, etc.
- Auth state: Zustand store (`store/auth.store.ts`) persisted to `localStorage` as `yk_auth`. Role-based redirect is handled client-side in each layout (`app/patient/layout.tsx`, `app/doctor/layout.tsx`).
- API calls: all go through `lib/api.ts` (axios instance). The axios interceptor attaches `Bearer` token from `localStorage`. Next.js rewrites `/api/*` → `http://localhost:3001/api/*` (see `next.config.js`).
- Real-time: `hooks/useNotifications.ts` connects to the Socket.IO `/notifications` namespace on mount (called in both role layouts). Pushes into `store/notification.store.ts`. The Navbar reads from this store for the bell badge and dropdown.
- Types: all shared TypeScript interfaces live in `types/index.ts`

### Key data flow — booking
1. Patient selects a slot → `POST /api/appointments`
2. API creates appointment with `status: CONFIRMED` + generates `jitsiRoomId`
3. API calls `NotificationsService.create()` twice — once for patient, once for doctor
4. Both users receive real-time `notification` event via Socket.IO

### Notification types used in the codebase
`BOOKING_CONFIRMED`, `NEW_BOOKING`, `RESCHEDULED`, `CANCELLED`, `APPOINTMENT_UPCOMING`

Frontend icon mapping (in `Navbar.tsx`): `APPOINTMENT_BOOKED` → teal calendar, `APPOINTMENT_UPCOMING` → blue clock, `APPOINTMENT_CANCELLED`/`APPOINTMENT_RESCHEDULED` → orange calendar-x.
