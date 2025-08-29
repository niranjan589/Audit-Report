# Infra Notes

- MongoDB: Atlas recommended. Set `MONGO_URI` for API and Worker.
- Redis: Use Upstash/Render/Fly. Set `REDIS_URL` for Worker (and API when queueing).
- Frontend hosting: Vercel/Netlify with `VITE_API_BASE_URL` env.
- Backend/Worker hosting: Render/Fly/Heroku with above env vars.

## Render Deployment

1. Commit repo and push to GitHub.
2. Create the following secrets in Render Dashboard → Secrets:
   - `MONGO_URI`, `REDIS_URL`, `OPEN_PAGERANK_API_KEY`, `SERPAPI_KEY`, `PAGESPEED_API_KEY`.
3. Add Blueprint: connect repo and select `render.yaml` at root.
4. Deploy. Services created:
   - Web: `audit-api` (Node, root `packages/api`)
   - Worker: `audit-worker` (Node, root `packages/worker`)
5. After deploy, set `CORS_ORIGIN` on `audit-api` to your frontend origin.

## Fly.io Deployment (outline)

- Create apps:
  - `fly apps create audit-api`
  - `fly apps create audit-worker`
- Create Dockerfiles or use `fly.toml` per app (Node builder or Docker):
  - API: expose 4000; run `node src/index.js`
  - Worker: `node src/index.js`
- Set secrets:
  - `fly secrets set MONGO_URI=... REDIS_URL=... OPEN_PAGERANK_API_KEY=... SERPAPI_KEY=... PAGESPEED_API_KEY=... -a audit-api`
  - Same for `audit-worker`.
- Scale as needed: `fly scale vm shared-cpu-1x -a audit-api`.

## Scheduled Audits
- Use BullMQ repeatable jobs for daily/weekly schedules stored in DB.

## Providers
- PageSpeed Insights, Open PageRank, SerpAPI keys required for production results.