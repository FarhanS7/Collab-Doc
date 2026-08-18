import client from 'prom-client';
import type { RequestHandler } from 'express';

// Enable collection of default Node.js process metrics (memory, CPU, handles)
client.collectDefaultMetrics({
  prefix: 'collab_',
});

export const activeRoomsGauge = new client.Gauge({
  name: 'collab_active_rooms',
  help: 'Number of active document rooms currently hosted across Socket.io adapter',
});

export const aiLatencyHistogram = new client.Histogram({
  name: 'ai_completion_first_token_ms',
  help: 'Latency in milliseconds from request receipt to first SSE token delivered to client',
  buckets: [50, 100, 200, 500, 800, 1200, 2000, 5000],
});

export const snapshotFailuresCounter = new client.Counter({
  name: 'ydoc_snapshot_write_failures_total',
  help: 'Total number of Y.js snapshot persistence write failures to PostgreSQL',
});

export const metricsHandler: RequestHandler = async (_req, res) => {
  try {
    res.set('Content-Type', client.register.contentType);
    const metricsData = await client.register.metrics();
    res.end(metricsData);
  } catch (err) {
    res.status(500).end(err instanceof Error ? err.message : 'Internal Server Error');
  }
};
