# Repo Info: Audit Report Monorepo

## Summary
- **Purpose**: Web app to audit websites for SEO, ranking, and social metrics; show results in interactive dashboard; export PDF/Excel.
- **Architecture**: Monorepo with frontend (React), backend API (Express), worker (queues), and infra.
- **DB**: MongoDB. **Queue**: BullMQ + Redis. **Auth**: SSO (Google/Microsoft).
- **Providers (MVP)**: Google PageSpeed Insights, Open PageRank, SerpAPI. Social: Facebook, Twitter/X, LinkedIn, Instagram, YouTube (staged rollout).

## Structure
```
packages/
  api/
    src/
      config/
      db/
        models/
      queue/
      routes/
      services/
        providers/
        social/
  worker/
    src/
      config/
      db/
        models/
      queue/
  frontend/
    src/
      components/
      pages/
infra/
```

## Environments (examples)
- API: `PORT`, `MONGO_URI`, `REDIS_URL`, `CORS_ORIGIN`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `MICROSOFT_TENANT_ID`, `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `OPEN_PAGERANK_API_KEY`, `SERPAPI_KEY`, `PAGESPEED_API_KEY`.
- Worker: `MONGO_URI`, `REDIS_URL`, provider keys.
- Frontend: `VITE_API_BASE_URL`.

## Initial APIs
- `POST /api/audits` → queue audit (placeholder in-memory for now)
- `GET /api/audits/:id` → fetch status/result
- `GET /api/providers/health` → check config

## Notes
- Placeholder implementations are provided to unblock UI/dev; real integrations will be added incrementally (Mongo, BullMQ, providers, SSO).