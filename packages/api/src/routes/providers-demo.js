const { Router } = require('express');
const { fetchPageSpeed } = require('../services/providers/pagespeed');
const { fetchOpenPageRank } = require('../services/providers/openpagerank');
const { fetchGoogleRank } = require('../services/providers/serpapi');
const { computeScores } = require('../services/score');

const router = Router();

// GET /api/providers-demo?url=https://example.com&keyword=example&domain=example.com
router.get('/', async (req, res) => {
  const url = (req.query.url || '').trim();
  const keyword = (req.query.keyword || '').trim();
  let domain = (req.query.domain || '').trim();
  if (!url) return res.status(400).json({ error: 'url is required' });

  // Normalize domain: if not provided, extract from URL; remove protocol and www
  if (!domain) {
    try {
      const u = new URL(url);
      domain = u.hostname || '';
    } catch (_) {
      domain = url;
    }
  }
  domain = domain.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0];

  const [ps, opr, serp] = await Promise.all([
    fetchPageSpeed(url).catch((e) => ({ ok: false, error: e.message })),
    fetchOpenPageRank(domain).catch((e) => ({ ok: false, error: e.message })),
    keyword && domain
      ? fetchGoogleRank(keyword, domain).catch((e) => ({ ok: false, error: e.message }))
      : Promise.resolve(null),
  ]);

  const scores = computeScores({ pageSpeed: ps || null, openPageRank: opr || null, serp: serp || null });

  res.json({ ok: true, providers: { pageSpeed: ps, openPageRank: opr, serp }, scores, normalized: { domain } });
});

module.exports = router;