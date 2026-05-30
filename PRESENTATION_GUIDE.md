# YourKalinga — 15-Minute Video Presentation Guide

## Pre-Presentation Checklist

- [ ] API running on port 3001 (`cd apps/api && npm run dev`)
- [ ] Web running on port 3000 (`cd apps/web && npm run dev`)
- [ ] Two browser windows ready (one for patient, one for doctor — use incognito for one)
- [ ] You will **create new accounts live** — do not use demo credentials
- [ ] Screen recording software ready (resolution: 1080p or higher)
- [ ] Close all unrelated tabs and notifications

---

## Segment 1 — Introduction (1 min)

**Script:**
> "YourKalinga is a telehealth platform that connects patients with doctors for online consultations. The name comes from the Filipino word 'kalinga,' meaning care or concern. It supports the full care journey — from finding a doctor, booking a slot, to conducting a video consultation and receiving prescriptions — all in one place."

**Show:** The landing / login page at `http://localhost:3000/login`

---

## Segment 2 — Patient Module (6 min)

### Step 1 — Registration (45 sec)
- Navigate to `/register`
- Create a new **patient** account live (e.g., `testpatient@demo.com`)
- Fill in name, email, password — submit
- You will be redirected to `/patient/dashboard`

### Step 2 — Complete Patient Profile (30 sec)
- Go to **Profile** page
- Fill in birthday, contact number, blood type, allergies
- Save — show success toast

### Step 3 — Browse Doctors (45 sec)
- Go to **Find Doctors**
- Show search bar — search by name or specialization
- Click into a doctor's profile
- Show their specialization, bio, years of experience, consultation fee, and reviews

### Step 4 — AI Doctor Recommendation (45 sec)
- Go to **AI Recommend** (in the sidebar)
- Type symptoms: e.g., `"I have a persistent headache and blurry vision"`
- Show the AI-recommended doctors list
- Explain: powered by Groq API, falls back to top-rated doctors if AI is unavailable

### Step 5 — Book an Appointment (1 min)
- From a doctor's profile, click **Book Appointment**
- Select a date from the calendar (pick an active weekday)
- Show available 30-minute time slots (9:00 AM – 5:00 PM)
- Select a slot, enter a reason, confirm
- Show the booking confirmation and the notification bell lighting up

### Step 6 — Notifications (30 sec)
- Click the bell icon in the navbar
- Show the **APPOINTMENT_BOOKED** notification (teal calendar icon)
- Mention: real-time via Socket.IO — no page refresh needed

### Step 7 — Reschedule / Cancel (30 sec)
- Go to **My Appointments**
- Show the CONFIRMED appointment in the **Upcoming** tab (same-day appointments with a future slot time stay here)
- Demonstrate **reschedule** (pick new date/time) OR **cancel**
- Show the status update

### Step 8 — Join Consultation (45 sec)
- On a confirmed appointment, click **Join Consultation**
- The Jitsi video room opens (room ID was generated at booking time)
- Explain: no third-party account needed — Jitsi is embedded directly

### Step 9 — Medical History & Records (30 sec)
- Go to **Medical Records** or **History**
- Show past consultations, notes, and any prescriptions
- Explain: all records are linked to consultation sessions

---

## Segment 3 — Doctor Module (5 min)

### Step 1 — Registration (30 sec)
- Open a second browser (incognito)
- Register a new **doctor** account
- Fill in specialization, license number, years of experience, bio, consultation fee
- Submit — redirected to `/doctor/dashboard`

### Step 2 — Doctor Profile (30 sec)
- Go to **My Profile**
- Show editable fields: bio, specialization, languages, fee
- Upload an avatar (Cloudinary)
- Save — show updated profile

### Step 3 — Schedule Management (1 min)
- Go to **My Schedule**
- Show the weekly availability grid (Monday–Sunday)
- Toggle days on/off — each active day offers 9:00 AM – 5:00 PM in 30-minute slots
- Toggle Monday OFF — explain that existing appointments on that day are automatically marked as RESCHEDULED and patients are notified
- Toggle it back ON
- Emphasize: changes take effect immediately for new bookings

### Step 4 — View Appointments (45 sec)
- Go to **Appointments**
- Show the **Upcoming** tab — same-day appointments with a future slot time appear here correctly
- Show patient name, date, time slot, and reason for visit

### Step 5 — Real-Time Notifications (45 sec)
- Click the bell icon — walk through the three notification scenarios:
  1. **New booking** (`APPOINTMENT_BOOKED`) — fires when a patient books; shows teal calendar icon
  2. **Upcoming appointment** (`APPOINTMENT_UPCOMING`) — sent automatically 1 hour before the appointment by a background cron job; shows blue clock icon
  3. **Rescheduled booking** (`APPOINTMENT_RESCHEDULED`) — fires when a patient reschedules; shows orange calendar icon
- All delivered via Socket.IO in real time — no page reload needed

### Step 6 — Join Consultation & Add Notes (1 min)
- Click **Start Session** on a confirmed appointment
- Jitsi video room opens (same room ID the patient has)
- After the call, show the **Add Notes** form:
  - Chief Complaint
  - Diagnosis
  - Findings
  - Recommendations
  - Follow-up date
- Add a prescription (medication, dosage, frequency, duration)
- Submit — note and prescription are saved to the session

### Step 7 — Patient Records Access (30 sec)
- Navigate to a patient's record from within a consultation
- Doctors can view uploaded medical records and past session history for their patients

---

## Segment 4 — Code Overview (2 min)

**Key files to briefly show:**

| What | File |
|------|------|
| NestJS app entry | `apps/api/src/main.ts` |
| JWT auth guard | `apps/api/src/auth/guards/jwt-auth.guard.ts` |
| Appointment booking | `apps/api/src/appointments/appointments.service.ts` |
| Real-time notifications gateway | `apps/api/src/notifications/notifications.gateway.ts` |
| Upcoming reminder cron | `apps/api/src/notifications/notification-scheduler.service.ts` |
| Schedule service | `apps/api/src/schedules/schedules.service.ts` |
| AI recommendation | `apps/api/src/ai/ai.service.ts` |
| Prisma schema | `apps/api/prisma/schema.prisma` |
| Next.js API client | `apps/web/lib/api.ts` |
| Auth store (Zustand) | `apps/web/store/auth.store.ts` |
| Patient booking page | `apps/web/app/patient/doctors/[id]/page.tsx` |
| Doctor schedule page | `apps/web/app/doctor/schedule/page.tsx` |

**Talking points:**
- Monorepo: NestJS API (`apps/api`) + Next.js frontend (`apps/web`)
- Database: Neon managed Postgres via Prisma ORM
- Auth: JWT (7-day access token) stored in `localStorage`, refresh token hashed in DB
- Roles: `@Public()` decorator for open routes, `@Roles('DOCTOR')` for doctor-only endpoints

---

## Segment 5 — Technical Challenges (1 min)

**Highlight one real challenge:**

> "One subtle bug I had to debug was a timezone offset issue in the scheduling system. When a patient in the Philippines (UTC+8) selected a date, JavaScript's `new Date('YYYY-MM-DD')` parses it as UTC midnight — which is actually 8 AM local time the same day. This caused two bugs: the server looked up the wrong day of the week for slot availability, and the frontend treated same-day appointments as 'past' as soon as UTC midnight passed. The fixes were to use `getUTCDay()` on the server, a local date formatter on the frontend for booking, and a local date string comparison (not datetime) for the upcoming/past filter."

---

## Segment 6 — Additional Questions (1 min)

**Q: Why does this project use 2026 dates?**
> "The system date on my development machine is set to 2026, which is why appointment dates appear in 2026. The application itself has no hardcoded year — all dates are dynamic and will work in any year."

**Q: Did you use Claude Code or AI assistance?**
> "Yes, I used Claude Code as a development assistant throughout this project. It helped me debug issues, refactor features, and navigate the codebase faster. All architectural decisions, feature design, and final implementation choices were made by me — Claude Code functioned as a pair programmer."

**Q: What do you think about LLMs in software development?**
> "LLMs are most useful for accelerating well-understood tasks — boilerplate, debugging familiar error patterns, and exploring APIs. They're less reliable for novel architecture decisions or domain-specific correctness. The key is knowing when to trust them and when to verify independently."

---

## Tips for a Smooth Recording

- Speak at a steady pace — pause briefly before switching screens
- Keep the browser DevTools closed unless showing something specific
- Use the sidebar for navigation — it shows the app's structure naturally
- If a feature fails during recording, say "let me try that again" and stay calm
- Record in one take if possible; cut with a video editor if needed
- Keep terminal output visible in a small window to show the live server

---

*Total target time: 15 minutes. Adjust pacing by cutting or expanding the code overview segment.*
