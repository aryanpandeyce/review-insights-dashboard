import fs from 'fs';
import path from 'path';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../app';
import { query } from '../db/pool';
import { SEED_PROPERTIES } from '../db/seedData';
import { upsertProperty } from '../repositories/propertyRepository';
import { processReviewImport } from '../services/importService';

const app = createApp();

describe('Analytics & Reviews API Integration Tests (/api/v1)', () => {
  beforeAll(async () => {
    const migrationPath = path.resolve(
      __dirname,
      '../../migrations/1700000000001_initial_schema.sql'
    );
    const fullSql = fs.readFileSync(migrationPath, 'utf8');
    const upSql = fullSql.split('-- Down Migration')[0] ?? fullSql;

    await query('DROP TABLE IF EXISTS review_topics, reviews, import_batches, properties CASCADE');
    await query(upSql);

    for (const prop of SEED_PROPERTIES) {
      await upsertProperty(prop);
    }

    await processReviewImport({
      filename: 'analytics-test-fixture.json',
      sourceType: 'json',
      rawRows: [
        {
          property_slug: 'amsterdam-canal-house',
          external_id: 'AN-1',
          reviewer_name: 'Sophie L.',
          guest_country_code: 'NL',
          guest_country_name: 'Netherlands',
          trip_type: 'couple',
          room_type: 'Canal View Deluxe',
          stay_nights: 3,
          score: 9.4,
          title: 'Fantastic canal views and friendly staff',
          positive_comment: 'Great location by the canal, spotless room, and friendly staff.',
          negative_comment: 'Tiny room size.',
          review_date: '2026-09-10',
          owner_response: 'Thank you for staying with us, Sophie!',
        },
        {
          property_slug: 'amsterdam-canal-house',
          external_id: 'AN-2',
          reviewer_name: 'James W.',
          guest_country_code: 'GB',
          guest_country_name: 'United Kingdom',
          trip_type: 'solo',
          room_type: 'Heritage Cozy Double',
          stay_nights: 2,
          score: 4.5,
          title: 'Noisy street and slow wifi',
          positive_comment: 'Central location.',
          negative_comment: 'Loud street noise kept us awake and slow wifi disconnected constantly.',
          review_date: '2026-09-15',
        },
        {
          property_slug: 'berlin-business-hotel',
          external_id: 'AN-3',
          reviewer_name: 'Klara H.',
          guest_country_code: 'DE',
          guest_country_name: 'Germany',
          trip_type: 'business',
          room_type: 'Executive Work Suite',
          stay_nights: 4,
          score: 8.8,
          title: 'Fast wifi and quiet rooms for work',
          positive_comment: 'Fast wifi, soundproofed quiet room, and spotless bathroom.',
          negative_comment: 'Cold coffee at breakfast.',
          review_date: '2026-09-18',
          owner_response: 'Glad our executive suite worked well for your business trip!',
        },
      ],
    });
  });

  it('GET /api/v1/properties lists all 4 seeded hotel properties', async () => {
    const res = await request(app).get('/api/v1/properties').expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(4);
    expect(res.body.data.map((p: { slug: string }) => p.slug)).toContain('amsterdam-canal-house');
  });

  it('GET /api/v1/analytics/overview returns KPI summary, sentiment shares, response rate, and per-property breakdown', async () => {
    const res = await request(app).get('/api/v1/analytics/overview').expect(200);

    expect(res.body.success).toBe(true);
    const { summary, byProperty } = res.body.data;
    expect(summary.totalReviews).toBe(3);
    expect(summary.avgScore).toBeCloseTo(7.6, 1);
    expect(summary.positiveCount).toBe(2);
    expect(summary.negativeCount).toBe(1);
    expect(summary.responseRatePct).toBeCloseTo(66.7, 1);
    expect(summary.unresolvedFlaggedCount).toBe(1);
    expect(byProperty).toHaveLength(4);
  });

  it('GET /api/v1/analytics/trends supports both monthly and weekly granularity', async () => {
    const monthlyRes = await request(app)
      .get('/api/v1/analytics/trends?granularity=monthly')
      .expect(200);
    expect(monthlyRes.body.data.granularity).toBe('monthly');
    expect(monthlyRes.body.data.series.length).toBeGreaterThanOrEqual(1);

    const weeklyRes = await request(app)
      .get('/api/v1/analytics/trends?granularity=weekly&propertyId=amsterdam-canal-house')
      .expect(200);
    expect(weeklyRes.body.data.granularity).toBe('weekly');
    expect(weeklyRes.body.data.series.length).toBeGreaterThanOrEqual(1);
  });

  it('GET /api/v1/analytics/distribution returns 10 score histogram buckets, trip types, and guest countries', async () => {
    const res = await request(app).get('/api/v1/analytics/distribution').expect(200);

    expect(res.body.data.totalReviews).toBe(3);
    expect(res.body.data.scoreHistogram).toHaveLength(10);
    expect(res.body.data.tripTypes.length).toBeGreaterThanOrEqual(2);
    expect(res.body.data.guestCountries.length).toBeGreaterThanOrEqual(2);
  });

  it('GET /api/v1/analytics/topics returns ranked topic strengths and weaknesses with sentiment percentages', async () => {
    const res = await request(app).get('/api/v1/analytics/topics').expect(200);

    expect(res.body.data.topics).toHaveLength(8);
    expect(res.body.data.strengths.length).toBeGreaterThan(0);
    expect(res.body.data.weaknesses.length).toBeGreaterThan(0);

    const locationTopic = res.body.data.topics.find(
      (t: { topic: string }) => t.topic === 'location'
    );
    expect(locationTopic.mentionCount).toBe(2);
    expect(locationTopic.positivePct).toBe(100);
  });

  it('GET /api/v1/analytics/comparison compares selected properties side-by-side and returns radar series', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/comparison?propertyIds=amsterdam-canal-house,berlin-business-hotel')
      .expect(200);

    expect(res.body.data.properties).toHaveLength(2);
    expect(res.body.data.radarData).toHaveLength(8);
  });

  it('GET /api/v1/reviews supports search, topic filtering, score range, sorting, and pagination', async () => {
    const searchRes = await request(app)
      .get('/api/v1/reviews?search=canal&topic=location&minScore=8')
      .expect(200);

    expect(searchRes.body.data.items).toHaveLength(1);
    expect(searchRes.body.data.items[0].reviewerName).toBe('Sophie L.');
    expect(searchRes.body.data.pagination.totalItems).toBe(1);
  });

  it('GET /api/v1/reviews/flagged and PATCH /api/v1/reviews/:id/resolve manage flagged review workflow', async () => {
    const flaggedRes = await request(app).get('/api/v1/reviews/flagged').expect(200);

    expect(flaggedRes.body.data.summary.totalFlagged).toBe(1);
    expect(flaggedRes.body.data.summary.unresolvedCount).toBe(1);

    const flaggedId = flaggedRes.body.data.items[0].id as string;

    const resolveRes = await request(app)
      .patch(`/api/v1/reviews/${flaggedId}/resolve`)
      .send({
        resolved: true,
        resolvedNotes: 'Upgraded router firmware and inspected window seals.',
      })
      .expect(200);

    expect(resolveRes.body.data.isResolved).toBe(true);
    expect(resolveRes.body.data.resolvedNotes).toBe(
      'Upgraded router firmware and inspected window seals.'
    );

    const afterSummary = await request(app).get('/api/v1/reviews/flagged').expect(200);
    expect(afterSummary.body.data.summary.unresolvedCount).toBe(0);
    expect(afterSummary.body.data.summary.resolvedCount).toBe(1);
  });

  it('GET /api/v1/reviews/export.csv exports filtered reviews as an attachment CSV', async () => {
    const csvRes = await request(app)
      .get('/api/v1/reviews/export.csv?propertyId=amsterdam-canal-house')
      .expect(200);

    expect(csvRes.headers['content-type']).toContain('text/csv');
    expect(csvRes.headers['content-disposition']).toContain('attachment; filename=');
    expect(csvRes.text).toContain('review_id,property_slug,property_name');
    expect(csvRes.text).toContain('Sophie L.');
  });

  it('GET /api/docs/openapi.json serves the OpenAPI 3.0 specification', async () => {
    const docRes = await request(app).get('/api/docs/openapi.json').expect(200);
    expect(docRes.body.openapi).toBe('3.0.3');
    expect(docRes.body.paths['/analytics/overview']).toBeDefined();
  });
});
