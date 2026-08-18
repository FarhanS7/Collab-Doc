import { describe, it, expect } from '@jest/globals';
import type { Request, Response } from 'express';
import { activeRoomsGauge, aiLatencyHistogram, snapshotFailuresCounter, metricsHandler } from './metrics.js';

describe('Metrics Module', () => {
  it('should initialize custom Prometheus metrics', () => {
    expect(activeRoomsGauge).toBeDefined();
    expect(aiLatencyHistogram).toBeDefined();
    expect(snapshotFailuresCounter).toBeDefined();
  });

  it('should increment and decrement activeRoomsGauge', async () => {
    activeRoomsGauge.set(0);
    activeRoomsGauge.inc();
    const metricsAfterInc = await activeRoomsGauge.get();
    expect(metricsAfterInc.values).toEqual(
      expect.arrayContaining([expect.objectContaining({ value: 1 })])
    );

    activeRoomsGauge.dec();
    const metricsAfterDec = await activeRoomsGauge.get();
    expect(metricsAfterDec.values).toEqual(
      expect.arrayContaining([expect.objectContaining({ value: 0 })])
    );
  });

  it('should record latency observations in aiLatencyHistogram', async () => {
    aiLatencyHistogram.observe(350);
    const data = await aiLatencyHistogram.get();
    expect(data.values.length).toBeGreaterThan(0);
  });

  it('should render Prometheus metrics string on metricsHandler execution', async () => {
    let responseBody = '';
    let contentType = '';

    const req = {} as Request;
    const res = {
      set: (header: string, value: string) => {
        if (header.toLowerCase() === 'content-type') contentType = value;
      },
      end: (data: string) => {
        responseBody = data;
      },
      status: () => res,
    } as unknown as Response;

    await metricsHandler(req, res, () => {});

    expect(contentType).toContain('text/plain');
    expect(responseBody).toContain('collab_active_rooms');
    expect(responseBody).toContain('ai_completion_first_token_ms');
  });
});
