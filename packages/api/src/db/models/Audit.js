const mongoose = require('mongoose');

const ScoresSchema = new mongoose.Schema(
  {
    seo: { type: Number, default: null },
    rank: { type: Number, default: null },
    domainRank: { type: Number, default: null },
    social: { type: Number, default: null },
    overall: { type: Number, default: null },
  },
  { _id: false }
);

const AuditSchema = new mongoose.Schema(
  {
    targetUrl: { type: String, required: true },
    keyword: { type: String, default: null },
    domain: { type: String, default: null },
    status: {
      type: String,
      enum: ['queued', 'running', 'done', 'failed'],
      default: 'queued',
    },
    error: { type: String, default: null },
    scores: { type: ScoresSchema, default: () => ({}) },
    providerData: { type: Object, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Audit || mongoose.model('Audit', AuditSchema);