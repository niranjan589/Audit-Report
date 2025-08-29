# Audit Report Monorepo (Scaffold)

## Getting Started
1. Install deps in each package:
   - `cd packages/api && npm install`
   - `cd packages/worker && npm install`
   - `cd packages/frontend && npm install`
2. Create `.env` files from `.env.example` in api/worker/frontend.
3. Run services:
   - API: `npm run dev` in `packages/api`
   - Worker: `npm run dev` in `packages/worker` (requires `REDIS_URL`)
   - Frontend: `npm run dev` in `packages/frontend` (access http://localhost:5173)

## Notes
- API has placeholder in-memory audits; DB/queues/providers will be wired incrementally.
- Check `infra/README.md` for environment setup.