# Pendoo — Product Requirements Document

**Status:** MVP scoping — final for build
**Author:** [Your name]
**Last updated:** July 6, 2026

---

## 1. Vision

Pendoo is a lightweight mobile app that helps people keep track of everything they're currently waiting for — job applications, passport processing, refunds, repairs, deliveries, approvals, medical results. One place to see what's still pending, instead of forgetting or digging through screenshots and old emails.

The goal isn't productivity. The goal is peace of mind.

## 2. Problem

People constantly wait for important things and have no dedicated way to track it — they forget, keep screenshots, search old emails, or rely on memory. No simple app exists focused entirely on managing pending items.

## 3. Goals

**Primary:** Help users remember everything they're waiting for.

**Secondary:**
- Reduce mental load
- Encourage timely follow-ups
- Create a satisfying history of completed waiting journeys

## 4. Target Users

**Primary:** Working professionals
**Secondary:** Students, job seekers, parents, freelancers — anyone who frequently waits for important events

## 5. Core User Stories

- As a user, I want to add something I'm waiting for so I don't forget it
- As a user, I want to know how long I've been waiting so I know when to follow up
- As a user, I want to mark something as completed so I can keep a record
- As a user, I want to browse completed waiting items so I can remember important milestones

## 6. MVP Features

### 6.1 Dashboard
Displays all active pending items. Each card shows:
- Title
- Category
- Days Waiting (large, plain typography — no progress ring; waiting has no natural "100%," so a ring implies false completion)
- Follow-up Date (optional)

Floating Action Button → Add Pending Item

### 6.2 Create Pending Item
Fields: Title, Category, Start Date, Follow-up Date (optional), Notes (optional)

*Follow-up Date replaces "Expected Date" — most things you wait for (job applications, refunds) don't have a known resolution date, but you often know when* you *should check in. This field is about your next action, not a system prediction.*

**Categories:** Career, Government, Orders, Repair, Health, Banking, Documents, Custom

### 6.3 Pending Details
Displays: Title, Category, Days Waiting, Start Date, Follow-up Date, Notes
Actions: Mark Complete, Edit, Delete

### 6.4 Completed History
Displays: Completed items, completion date, total days waited

### 6.5 Empty State
When there are no active items: a calm Lucide icon (e.g. a simple leaf or check-circle glyph, not decorative illustration) with the message *"Nothing pending. That's a peaceful place to be."* — reframes an empty list as relief, not a call to add more items.

### 6.6 Simple Reminder (moved into MVP)
Basic local notification nudging follow-up on items waiting past a threshold — e.g. *"It's been 14 days for your passport. Maybe it's time to check in."* Phrased as a gentle nudge toward action, not just a day count.
Kept simple for MVP: one fixed threshold, no customization, no smart timing logic (that's v1.1's "Smart Notifications" territory — this is the lightweight version pulled forward so the app has at least one reason to pull users back in daily).

### 6.7 Iconography
No emoji anywhere in the UI. Use a consistent icon set (Lucide, via `lucide_flutter` or an equivalent Flutter port) for categories, empty states, and reminders — keeps the visual language calm and native-feeling rather than playful/emoji-driven.

## 7. Platforms

**Android first.**
No access to an iOS device for testing, so shipping blind on iOS is a risk not worth taking for V1. Flutter's shared codebase means iOS can follow later without a rewrite — once there's a way to test properly (simulator via Mac, cloud Mac service, or a tester from the community), iOS becomes a fast follow rather than a rebuild.

## 8. Data & Accounts

**No accounts for MVP.** Local storage only (SQLite), offline-first.
**No backup for V1** — accepted risk that switching/losing a phone means losing data. Backup (cloud sync via Supabase/Firebase) is explicitly a post-MVP addition, not a blocker for launch.

## 9. Monetization

**Free for MVP** — full feature set open to everyone, no paywall, no limits.
**Freemium planned for later**, once usage data shows what's actually worth gating (likely candidates already scoped: unlimited active items past a free cap, statistics, attachments, cloud backup). Decision on exact paywall shape deferred until post-launch data exists — building it now would be guessing.

One-time purchase (not subscription) remains the model when premium is introduced — this is a low-frequency utility app, not a daily-habit product, so recurring billing is a poor fit.

## 10. Post-MVP Roadmap

**v1.1** — Smart Notifications (action-oriented nudges — "Time to follow up?" rather than just reporting a day count — plus outcome tagging on completion, e.g. Accepted/Rejected, Received, Fixed, Refunded, feeding future stats)
**v1.2** — Statistics (completed items, average wait time, longest wait, current active count)
**v1.3** — Growth Visualization: a "garden" concept where a simple, calm visual (rendered with icons/illustration, not emoji) evolves as completed items accumulate — e.g. a seedling icon at 0, gradually filling out at 5, 20, 50, 100 completions. Purpose is reflection ("look how much you've gotten through"), not gamification — explicitly no badges, no streaks, no XP. Needs its own design pass (icon/illustration set, a dedicated screen) before scoping into a sprint — not a quick add.
**v1.4** — Timeline (life timeline of completed waiting milestones)
**v1.5** — Attachments (photos, receipts, tracking numbers, documents)
**v1.6** — Status Workflow (custom multi-step statuses, e.g. Applied → Under Review → Interview → Offer → Completed)

**Future ideas (unscoped):** calendar integration, export history, backup, widgets, shared pending items, AI follow-up suggestions, email parsing

## 11. Non-Goals

No chat. No social features. No productivity suite. No task management. No habit tracking. No note-taking platform. The app stays focused on one problem only.

## 12. Design Principles

Minimal. Fast. One-handed operation. No unnecessary setup. No accounts for MVP. Everything accessible within two taps.

## 13. Success Metrics

- Number of active users
- Average pending items per user
- Daily opens
- Completion rate
- Average session time
- Retention after 30 days

## 14. Technical Stack

- **Frontend:** Flutter
- **Backend:** Local SQLite (MVP)
- **Future backend:** Supabase/Firebase (for backup/sync)
- **Notifications:** Flutter Local Notifications
- **State Management:** Riverpod
- **Architecture:** Offline-first

## 15. MVP Definition of Done

A user can, without creating an account:
- Create a pending item
- View all pending items
- See waiting duration
- Edit items
- Delete items
- Mark items completed
- View completed history
- See a calm empty state when nothing is pending
- Receive a basic follow-up reminder

## 16. Product Philosophy

People already have enough to think about. Pendoo exists so users can stop carrying unfinished things in their heads. If something is still pending, the app remembers it — so the user doesn't have to.
