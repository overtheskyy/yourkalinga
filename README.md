# YourKalinga — Telehealth Platform

> *Kalinga* (Filipino): to care for someone · Personal, patient-owned care.

A full-stack telehealth MVP built for the WC Launchpad Builder Round. Connect patients with Filipino doctors for virtual consultations powered by AI recommendations and Jitsi Meet video.

**Stack: Next.js 14 · NestJS · PostgreSQL · Prisma · Socket.IO · Groq AI · Jitsi Meet**

---

## Quick Start (Docker)

```bash
# 1. Clone and configure
cp .env.example .env
# Edit .env — add your GROQ_API_KEY (free at console.groq.com)

# 2. Start everything
docker compose up

# 3. Run migrations and seed
docker compose exec api npm run db:push
docker compose exec api npm run db:seed
```

Open http://localhost:3000 — demo accounts are shown on the login page.

---

## Quick Start (Local)

**Requirements:** Node 20, PostgreSQL 14+

```bash
# Install dependencies
npm install        # root
cd apps/api && npm install
cd ../web && npm install

# Set up database
cd ../api
# Edit .env — set DATABASE_URL to your local postgres
npm run db:push
npm run db:seed

# Start both servers (from root)
cd ../..
npm run dev
```

---

## Demo Accounts

| Role    | Email                          | Password     |
|---------|-------------------------------|--------------|
| Patient | patient@yourkalinga.com        | Patient123!  |
| Doctor  | dr.reyes@yourkalinga.com       | Doctor123!   |
| Doctor  | dr.santos@yourkalinga.com      | Doctor123!   |

(10 seeded doctors across all specializations)

---

## Features

### Patient
- Register / login with profile (name, birthday, weight, height, medical history)
- Browse doctors with search and specialization filters
- **AI Symptom Checker** — describe symptoms → Groq/Llama recommends specialists
- Book, reschedule, cancel appointments
- Join video consultations via Jitsi Meet (embedded, no account needed)
- View medical records and prescriptions from past consultations
- Real-time notifications via Socket.IO

### Doctor
- Register / login with profile (specialization, bio, languages, fee)
- Manage weekly schedule — enable/disable days, set hours
- View upcoming and past appointments
- Start consultation sessions
- Add consultation notes + issue prescriptions after sessions
- Access patient medical history

---

## Architecture

```
yourkalinga/
├── apps/
│   ├── api/          NestJS REST + WebSocket API → Render
│   │   ├── src/auth  JWT + bcrypt authentication
│   │   ├── src/ai    Groq API (Llama 3.3 70B) integration
│   │   └── prisma/   PostgreSQL schema + seed
│   └── web/          Next.js 14 App Router → Vercel
│       ├── app/(patient)/   Patient portal
│       └── app/(doctor)/    Doctor portal
├── docker-compose.yml
└── .env.example
```

**Free-tier deployment:**
- Frontend: Vercel (always-on, no cold start)
- Backend: Render (free Docker, 30-50s cold start — warm before demo)
- Database: Neon (managed Postgres, free tier)
- AI: Groq API (free, ~1000 req/day)
- Video: Jitsi Meet (open source, zero config)

---

## Environment Variables

See `.env.example`. Key variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Change in production! |
| `GROQ_API_KEY` | Free at console.groq.com — starts with `gsk_` |
| `NEXT_PUBLIC_API_URL` | Backend URL (http://localhost:3001 locally) |

---

## Deployment

### Deploy to Vercel + Render + Neon

1. **Database** — Create Neon project, copy connection string to `DATABASE_URL`
2. **Backend** — Push `apps/api` to Render as Docker service, set env vars
3. **Migrations** — Run `prisma db push` and seed in Render shell
4. **Frontend** — Connect GitHub repo to Vercel, set `NEXT_PUBLIC_API_URL` to Render URL

⚠️ Warm the Render URL 1 minute before recording your demo to avoid cold-start delays.

---

*YourKalinga — Maingat na pag-aalaga para sa inyong kalusugan*
