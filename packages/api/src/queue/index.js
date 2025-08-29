const { Queue } = require('bullmq');
const IORedis = require('ioredis');

let auditQueue = null;

function getAuditQueue() {
  if (auditQueue) return auditQueue;
  const url = process.env.REDIS_URL;
  if (!url) return null;
  // Align with BullMQ v5 requirement
  const connection = new IORedis(url, { maxRetriesPerRequest: null });
  auditQueue = new Queue('audit-jobs', { connection });
  return auditQueue;
}

module.exports = { getAuditQueue };