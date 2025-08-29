const { Router } = require('express');
const Audit = require('../db/models/Audit');
const { getAuditQueue } = require('../queue');

const router = Router();

// Create new audit (persist to Mongo, enqueue to BullMQ if configured)
router.post('/', async (req, res) => {
  try {
    const targetUrl = (req.body?.url || '').trim();
    const keyword = (req.body?.keyword || '').trim() || null;
    let domain = (req.body?.domain || '').trim() || null;
    if (!targetUrl) return res.status(400).json({ error: 'url is required' });

    // Normalize domain for providers (e.g., OPR, SERP)
    function normalizeDomain(input) {
      if (!input) return null;
      try {
        const u = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`);
        return (u.hostname || '').replace(/^www\./, '');
      } catch (_) {
        return String(input)
          .replace(/^https?:\/\//i, '')
          .replace(/^www\./i, '')
          .split('/')[0] || null;
      }
    }

    const normalizedDomain = normalizeDomain(domain || targetUrl);
    domain = normalizedDomain;

    const doc = await Audit.create({ targetUrl, keyword, domain, status: 'queued' });

    const queue = getAuditQueue();
    if (queue) {
      await queue.add('audit', { auditId: doc._id.toString() }, { attempts: 2, backoff: { type: 'exponential', delay: 5000 } });
    } else {
      console.warn('[api] REDIS_URL not set; audit not enqueued');
    }

    return res.status(202).json({ auditId: doc._id.toString(), status: 'queued' });
  } catch (err) {
    console.error('[api] create audit error', err);
    return res.status(500).json({ error: 'Failed to create audit' });
  }
});

// List audits by targetUrl for history
router.get('/', async (req, res) => {
  try {
    const { targetUrl, limit } = req.query;
    if (!targetUrl) return res.status(400).json({ error: 'targetUrl is required' });
    const lim = Math.max(1, Math.min(200, parseInt(limit || '20', 10)));
    const docs = await Audit.find({ targetUrl }).sort({ createdAt: -1 }).limit(lim).lean();
    return res.json({
      items: docs.map((doc) => ({
        id: doc._id,
        targetUrl: doc.targetUrl,
        domain: doc.domain,
        createdAt: doc.createdAt,
        status: doc.status,
        scores: doc.scores || {},
        error: doc.error || null,
      })),
      count: docs.length,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to list' });
  }
});

// Get audit by id
router.get('/:id', async (req, res) => {
  try {
    const doc = await Audit.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ error: 'Not found' });
    return res.json({
      id: doc._id,
      targetUrl: doc.targetUrl,
      keyword: doc.keyword,
      domain: doc.domain,
      status: doc.status,
      error: doc.error || null,
      scores: doc.scores || {},
      providerData: doc.providerData || {},
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch' });
  }
});

module.exports = router;