import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

// Donut chart for a single percentage value
function Donut({ value = 0, size = 160, label = 'Overall', gradientId = 'g1' }) {
  const radius = (size - 18) / 2; // padding for stroke width
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const dash = (clamped / 100) * circumference;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <linearGradient id={gradientId} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#6ee7ff" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
      </defs>
      <g transform={`translate(${size / 2} ${size / 2})`}>
        <circle r={radius} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="14" />
        <circle
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="14"
          strokeDasharray={`${dash} ${circumference - dash}`}
          transform="rotate(-90)"
          strokeLinecap="round"
        />
        <text textAnchor="middle" dominantBaseline="middle" fontWeight="800" fontSize="28" fill="#e6e9f0">
          {Math.round(clamped)}
        </text>
        <text y={20} textAnchor="middle" fontSize="12" fill="#9aa4b2">{label}</text>
      </g>
    </svg>
  );
}

// Simple horizontal bars for category scores
function Bars({ data }) {
  const entries = Object.entries(data || {});
  if (!entries.length) return <div className="stat-sub">No score data</div>;
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {entries.map(([k, v]) => {
        const val = typeof v === 'number' ? Math.max(0, Math.min(100, v)) : 0;
        const label = k.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
        return (
          <div key={k}>
            <div className="flex justify-between" style={{ marginBottom: 6 }}>
              <span className="stat-title">{label}</span>
              <span className="stat-title">{val}</span>
            </div>
            <div style={{ height: 10, background: 'rgba(255,255,255,0.08)', borderRadius: 999, border: '1px solid var(--border)' }}>
              <div
                style={{
                  height: '100%',
                  width: `${val}%`,
                  background: 'linear-gradient(90deg, var(--primary), var(--secondary))',
                  borderRadius: 999,
                  boxShadow: '0 6px 14px rgba(110,231,255,0.2)'
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ThemeToggle() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
    // Default: dark
    return 'dark';
  });
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') root.setAttribute('data-theme', 'light');
    else root.removeAttribute('data-theme');
    localStorage.setItem('theme', theme);
  }, [theme]);
  return (
    <button
      className="button-primary"
      style={{ height: 36 }}
      onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
      title={theme === 'light' ? 'Switch to dark' : 'Switch to light'}
    >
      {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
    </button>
  );
}

export default function App() {
  const [url, setUrl] = useState('');
  const [domain, setDomain] = useState('');
  const [keyword, setKeyword] = useState('');
  const [auditId, setAuditId] = useState('');
  const [audit, setAudit] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const pollRef = useRef(null);
  const [perf, setPerf] = useState(null);
  const [perfLoading, setPerfLoading] = useState(false);
  const [perfError, setPerfError] = useState('');
  const [history, setHistory] = useState([]);
  const [historyErr, setHistoryErr] = useState('');

  async function createAudit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    clearInterval(pollRef.current);
    try {
      const payload = { url };
      if (domain) payload.domain = domain;
      if (keyword) payload.keyword = keyword;
      const res = await axios.post(`${API_BASE}/api/audits`, payload);
      setAuditId(res.data.auditId);
      setAudit(null);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to create audit');
    } finally {
      setLoading(false);
    }
  }

  async function fetchAudit() {
    if (!auditId) return;
    try {
      const res = await axios.get(`${API_BASE}/api/audits/${auditId}`);
      setAudit(res.data);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to fetch audit');
    }
  }

  // Fetch performance/usability snapshot via providers-demo
  async function fetchPerformanceSnapshot(targetUrl, domainHint, kw) {
    if (!targetUrl) return;
    setPerfLoading(true);
    setPerfError('');
    try {
      const params = new URLSearchParams();
      params.set('url', targetUrl);
      if (domainHint) params.set('domain', domainHint);
      if (kw) params.set('keyword', kw);
      const { data } = await axios.get(`${API_BASE}/api/providers-demo?${params.toString()}`);
      if (!data?.ok) throw new Error('providers-demo returned error');
      setPerf(data);
    } catch (e) {
      setPerfError(e?.response?.data?.error || e.message || 'Failed to fetch performance');
    } finally {
      setPerfLoading(false);
    }
  }

  // Fetch audit history by targetUrl
  async function fetchHistory(targetUrl, limit = 20) {
    if (!targetUrl) return;
    setHistoryErr('');
    try {
      const { data } = await axios.get(`${API_BASE}/api/audits`, { params: { targetUrl, limit } });
      setHistory(Array.isArray(data?.items) ? data.items.reverse() : []); // oldest -> newest for chart
    } catch (e) {
      setHistoryErr(e?.response?.data?.error || e.message || 'Failed to fetch history');
      setHistory([]);
    }
  }

  // Auto-poll until status is done/failed
  useEffect(() => {
    if (!auditId) return;
    fetchAudit();
    pollRef.current = setInterval(fetchAudit, 3000);
    return () => clearInterval(pollRef.current);
  }, [auditId]);

  useEffect(() => {
    if (!audit) return;
    // when audit reaches a terminal state, stop polling and fetch performance snapshot
    if (audit.status === 'done' || audit.status === 'failed') {
      clearInterval(pollRef.current);
      // Trigger performance/usability analysis snapshot and history fetch
      fetchPerformanceSnapshot(audit.targetUrl, audit.domain, audit.keyword);
      fetchHistory(audit.targetUrl);
    }
  }, [audit]);

  const isRunning = audit && (audit.status === 'queued' || audit.status === 'running');

  // Compute numeric analytics from scores
  const analytics = useMemo(() => {
    const s = audit?.scores || {};
    const keys = ['seo', 'rank', 'domainRank', 'social', 'overall'];
    const vals = keys.map((k) => (typeof s[k] === 'number' ? s[k] : null)).filter((v) => v !== null);
    const avg = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
    const completeness = Math.round((vals.length / keys.length) * 100);
    const nonNull = keys.reduce((acc, k) => ({ ...acc, [k]: typeof s[k] === 'number' ? s[k] : 0 }), {});

    return {
      avg,
      completeness,
      count: vals.length,
      categories: nonNull,
      overall: typeof s.overall === 'number' ? s.overall : avg,
    };
  }, [audit]);

  // Derive a simple usability score from Lighthouse metrics
  const usability = useMemo(() => {
    const ps = perf?.providers?.pageSpeed?.normalized;
    if (!ps) return null;
    let score = 100;
    const clamp = (n) => Math.max(0, Math.min(100, Math.round(n)));
    // Penalties: higher LCP/TBT/CLS reduce usability
    if (typeof ps.lcpMs === 'number') {
      if (ps.lcpMs > 4000) score -= 20; else if (ps.lcpMs > 2500) score -= 10;
    }
    if (typeof ps.tbtMs === 'number') {
      if (ps.tbtMs > 600) score -= 25; else if (ps.tbtMs > 300) score -= 10;
    }
    if (typeof ps.cls === 'number') {
      if (ps.cls > 0.25) score -= 20; else if (ps.cls > 0.1) score -= 10;
    }
    return clamp(score);
  }, [perf]);

  // Helpers for formatting metrics
  const fmtMs = (v) => (v == null ? '—' : Math.round(Number(v)));
  const fmtCLS = (v) => (v == null ? '—' : Number(v).toFixed(3));

  // Build a simple HTML report for export
  const buildReportHTML = () => {
    const ps = perf?.providers?.pageSpeed?.normalized || {};
    const opr = perf?.providers?.openPageRank?.normalized || {};
    const serp = perf?.providers?.serp?.normalized || {};
    const createdAt = new Date().toLocaleString();
    const style = `
      <style>
        body { font-family: Arial, sans-serif; color: #111; }
        h1 { margin: 0 0 8px; }
        h2 { margin: 18px 0 8px; }
        .muted { color: #555; font-size: 12px; }
        .kpi { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
        .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #eee; }
        .row b { color: #111; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        th, td { border: 1px solid #ddd; padding: 6px; text-align: left; font-size: 12px; }
        th { background: #f5f5f5; }
      </style>
    `;
    const histRows = (history || []).slice(-10).map(h => `
      <tr>
        <td>${new Date(h.createdAt).toLocaleString()}</td>
        <td>${h.scores?.overall ?? '—'}</td>
        <td>${h.scores?.seo ?? '—'}</td>
      </tr>
    `).join('');
    return `<!doctype html><html><head><meta charset="utf-8"/>${style}</head><body>
      <h1>Audit Report</h1>
      <div class="muted">Generated: ${createdAt}</div>
      <div class="muted">URL: ${audit?.targetUrl || ''}</div>
      <div class="muted">Status: ${audit?.status || ''}</div>

      <h2>Key Metrics</h2>
      <div class="kpi">
        <div class="row"><span>Overall Score</span><b>${Math.round(analytics.overall)}</b></div>
        <div class="row"><span>Average Category</span><b>${analytics.avg}</b></div>
        <div class="row"><span>Completeness</span><b>${analytics.completeness}%</b></div>
        <div class="row"><span>Categories Count</span><b>${analytics.count}/5</b></div>
      </div>

      <h2>Performance (Lighthouse)</h2>
      <div class="row"><span>Perf Score</span><b>${ps.performance ?? '—'}</b></div>
      <div class="row"><span>FCP (ms)</span><b>${fmtMs(ps.fcpMs)}</b></div>
      <div class="row"><span>LCP (ms)</span><b>${fmtMs(ps.lcpMs)}</b></div>
      <div class="row"><span>TBT (ms)</span><b>${fmtMs(ps.tbtMs)}</b></div>
      <div class="row"><span>CLS</span><b>${fmtCLS(ps.cls)}</b></div>

      <h2>Usability & Ranking</h2>
      <div class="row"><span>Domain Rank (OPR)</span><b>${opr.rank ?? '—'}</b></div>
      <div class="row"><span>SERP Rank</span><b>${serp.rank ?? '—'}</b></div>
      <div class="row"><span>Overall (Recomputed)</span><b>${perf?.scores?.overall ?? '—'}</b></div>
      <div class="row"><span>Usability Index</span><b>${usability ?? '—'}</b></div>

      <h2>Recent History</h2>
      <table>
        <thead><tr><th>Date</th><th>Overall</th><th>SEO</th></tr></thead>
        <tbody>${histRows || ''}</tbody>
      </table>
    </body></html>`;
  };

  const downloadReportAsDoc = () => {
    const html = buildReportHTML();
    const blob = new Blob([html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'audit-report.doc';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const downloadReportAsPdf = () => {
    // Open a print-friendly window; users can "Save as PDF"
    const html = buildReportHTML();
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.open();
    win.document.write(html + '<script>window.onload = function(){ setTimeout(function(){ window.print(); }, 300); }<\/script>');
    win.document.close();
  };

  return (
    <div className="container">
      {/* Header */}
      <div className="header">
        <div className="brand">
          <div className="brand-badge" />
          <div>
            <h1>Audit Report Dashboard</h1>
            <div className="stat-sub">SEO • Ranking • Social • Performance</div>
          </div>
        </div>
        <div className="right">
          <ThemeToggle />
          {auditId && <span className="tag">ID: {String(auditId).slice(0, 8)}…</span>}
        </div>
      </div>

      {/* Input form */}
      <div className="grid">
        <div className="card padded" style={{ gridColumn: 'span 12' }}>
          <div className="section-title">Create New Audit</div>
          <form className="form" onSubmit={createAudit}>
            <input
              className="input"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
            <input
              className="input"
              placeholder="domain (optional, e.g., example.com)"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
            />
            <input
              className="input"
              placeholder="keyword (optional for SERP)"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <button className="button-primary" type="submit" disabled={loading}>
              {loading ? 'Submitting…' : 'Create Audit'}
            </button>
          </form>
          {error && <div className="mt-16" style={{ color: 'var(--danger)' }}>{error}</div>}
        </div>
      </div>

      {/* Analytics */}
      {audit && (
        <div className="grid mt-20">
          {/* Left: KPIs */}
          <div className="card padded" style={{ gridColumn: 'span 7' }}>
            <div className="section-title">Key Metrics</div>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-title">Overall Score</div>
                <div className="stat-value" style={{ color: 'var(--primary)' }}>{Math.round(analytics.overall)}</div>
                <div className="stat-sub">Consolidated KPI</div>
              </div>
              <div className="stat-card">
                <div className="stat-title">Average Category</div>
                <div className="stat-value" style={{ color: 'var(--secondary)' }}>{analytics.avg}</div>
                <div className="stat-sub">Mean of available scores</div>
              </div>
              <div className="stat-card">
                <div className="stat-title">Completeness</div>
                <div className="stat-value" style={{ color: 'var(--success)' }}>{analytics.completeness}%</div>
                <div className="stat-sub">Fields populated</div>
              </div>
              <div className="stat-card">
                <div className="stat-title">Categories Count</div>
                <div className="stat-value">{analytics.count}/5</div>
                <div className="stat-sub">Non-null scores</div>
              </div>
              <div className="stat-card">
                <div className="stat-title">Status</div>
                <div className="stat-value" style={{ color: isRunning ? 'var(--warning)' : audit.status === 'failed' ? 'var(--danger)' : 'var(--success)' }}>
                  {audit.status?.toUpperCase()}
                </div>
                <div className="stat-sub">Processing indicator</div>
              </div>
            </div>

            <div className="chart-card mt-16">
              <div className="panel" style={{ display: 'grid', placeItems: 'center' }}>
                <Donut value={analytics.overall || 0} label="Overall" gradientId="overallGrad" />
              </div>
              <div className="panel">
                <Bars data={analytics.categories} />
              </div>
            </div>

            {/* Export controls (visible when we have results) */}
            {perf && (
              <div className="flex items-center gap-12 mt-16">
                <button className="button-primary" onClick={downloadReportAsPdf}>Download PDF</button>
                <button className="button-primary" onClick={downloadReportAsDoc}>Download DOC</button>
              </div>
            )}

            {/* History: Performance over time */}
            <div className="card padded mt-16">
              <div className="section-title">Performance Over Time (URL)</div>
              {historyErr && <div className="stat-sub" style={{ color: 'var(--danger)' }}>{historyErr}</div>}
              {history.length > 1 ? (
                <Line
                  data={{
                    labels: history.map((h) => new Date(h.createdAt).toLocaleString()),
                    datasets: [
                      {
                        label: 'Overall',
                        data: history.map((h) => (typeof h.scores?.overall === 'number' ? h.scores.overall : null)),
                        borderColor: getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#6ee7ff',
                        backgroundColor: 'rgba(110,231,255,0.2)',
                        tension: 0.35,
                        spanGaps: true,
                        fill: true,
                      },
                      {
                        label: 'SEO',
                        data: history.map((h) => (typeof h.scores?.seo === 'number' ? h.scores.seo : null)),
                        borderColor: getComputedStyle(document.documentElement).getPropertyValue('--secondary').trim() || '#a78bfa',
                        backgroundColor: 'rgba(167,139,250,0.15)',
                        tension: 0.35,
                        spanGaps: true,
                        fill: true,
                      },
                    ],
                  }}
                  options={{
                    plugins: { legend: { labels: { color: getComputedStyle(document.documentElement).getPropertyValue('--text').trim() || '#e6e9f0' } } },
                    scales: {
                      x: { ticks: { color: getComputedStyle(document.documentElement).getPropertyValue('--muted').trim() || '#9aa4b2', maxRotation: 0 }, grid: { color: getComputedStyle(document.documentElement).getPropertyValue('--border').trim() || 'rgba(255,255,255,0.06)' } },
                      y: { beginAtZero: true, max: 100, ticks: { color: getComputedStyle(document.documentElement).getPropertyValue('--muted').trim() || '#9aa4b2' }, grid: { color: getComputedStyle(document.documentElement).getPropertyValue('--border').trim() || 'rgba(255,255,255,0.06)' } },
                    },
                  }}
                />
              ) : (
                <div className="stat-sub">Not enough history yet. Run more audits for this URL to see trends.</div>
              )}
            </div>

            {/* Performance & Usability */}
            <div className="chart-card mt-16">
              <div className="panel">
                <div className="section-title">Performance (Lighthouse)</div>
                {perfLoading && <div className="stat-sub">Fetching performance…</div>}
                {perfError && <div style={{ color: 'var(--danger)' }} className="stat-sub">{perfError}</div>}
                {perf && perf.providers?.pageSpeed && (
                  <div style={{ display: 'grid', gap: 10 }}>
                    <div className="flex justify-between"><span className="stat-title">Perf Score</span><span>{perf.providers.pageSpeed.normalized?.performance ?? '—'}</span></div>
                    <div className="flex justify-between"><span className="stat-title">FCP (ms)</span><span>{fmtMs(perf.providers.pageSpeed.normalized?.fcpMs)}</span></div>
                    <div className="flex justify-between"><span className="stat-title">LCP (ms)</span><span>{fmtMs(perf.providers.pageSpeed.normalized?.lcpMs)}</span></div>
                    <div className="flex justify-between"><span className="stat-title">TBT (ms)</span><span>{fmtMs(perf.providers.pageSpeed.normalized?.tbtMs)}</span></div>
                    <div className="flex justify-between"><span className="stat-title">CLS</span><span>{fmtCLS(perf.providers.pageSpeed.normalized?.cls)}</span></div>
                  </div>
                )}
              </div>
              <div className="panel">
                <div className="section-title">Usability & Ranking</div>
                {perf && (
                  <div style={{ display: 'grid', gap: 10 }}>
                    <div className="flex justify-between"><span className="stat-title">Domain Rank (OPR)</span><span>{perf.providers?.openPageRank?.normalized?.rank ?? '—'}</span></div>
                    <div className="flex justify-between"><span className="stat-title">SERP Rank</span><span>{perf.providers?.serp?.normalized?.rank ?? '—'}</span></div>
                    <div className="flex justify-between"><span className="stat-title">Overall (Recomputed)</span><span>{perf.scores?.overall ?? '—'}</span></div>
                    <div className="flex justify-between"><span className="stat-title">Usability Index</span><span>{usability ?? '—'}</span></div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Details */}
          <div className="card padded" style={{ gridColumn: 'span 5' }}>
            <div className="section-title">Audit Details</div>
            <div className="panel">
              <div className="flex items-center justify-between">
                <div>
                  <div className="stat-title">URL</div>
                  <div style={{ fontWeight: 600 }}>{audit.targetUrl}</div>
                </div>
                <span className={`badge ${audit.status}`}>{audit.status.toUpperCase()}</span>
              </div>
              <div className="mt-16 details">
                <div className="stat-title">Scores</div>
                <pre>{JSON.stringify(audit.scores || {}, null, 2)}</pre>
              </div>
              {audit.error && (
                <div className="mt-16">
                  <div className="stat-title">Error</div>
                  <pre style={{ color: 'var(--danger)' }}>{audit.error}</pre>
                </div>
              )}
              
            </div>

            <div className="flex items-center gap-12 mt-16">
              <button className="button-primary" onClick={fetchAudit} disabled={loading}>
                {isRunning ? 'Refresh (processing…) ' : 'Refresh Now'}
              </button>
              {auditId && <span className="tag">ID: {auditId}</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}