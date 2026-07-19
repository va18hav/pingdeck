# PingDeck — API Testing & Uptime Monitoring

PingDeck is an uptime monitoring tool for HTTP APIs. You register endpoints, set a check interval, and the system pings them automatically in the background. If something goes down, it queues an alert. You get a dashboard with latency graphs and response history.

**Live:** https://api-monitoring-platform.vercel.app

---

## What's in this repo

```
├── Backend/          Node.js/TypeScript monorepo (API server + background worker)
└── Frontend/         React app (Vite + Tailwind CSS)
```

The backend is split into two independent services that talk through a Redis queue:

- **Scheduler** — REST API for user auth, project/endpoint config, and scheduling
- **Worker** — background process that executes the actual HTTP pings and writes results

See [`Backend/ARCHITECTURE.md`](./Backend/ARCHITECTURE.md) for how these fit together.

---

## Tech stack

**Backend:** TypeScript, Node.js, Express, BullMQ, Redis, PostgreSQL, Prisma ORM, Docker, AWS EC2, Nginx

**Frontend:** React, TypeScript, Vite, Tailwind CSS v4, Zustand, TanStack Query

**Observability:** Prometheus (`prom-client`), Grafana Loki, Promtail, Pino, k6

---

## Getting started

See [`Backend/README.md`](./Backend/README.md) for backend setup and [`Frontend/README.md`](./Frontend/README.md) for the frontend.

git remote set-url origin https://github.com/va18hav/pingdeck.git
