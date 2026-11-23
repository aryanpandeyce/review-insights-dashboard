export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Review Insights Dashboard API',
    version: '1.0.0',
    description:
      'REST API for multi-property hotel review analytics, rule-based topic sentiment insights, review exploration, flagged review workflows, and idempotent CSV/JSON imports.',
  },
  servers: [
    {
      url: '/api/v1',
      description: 'API v1',
    },
  ],
  tags: [
    { name: 'Health', description: 'Service and PostgreSQL connectivity health probe' },
    { name: 'Properties', description: 'Hotel properties metadata' },
    { name: 'Analytics', description: 'Aggregated KPIs, trends, distributions, topics, and comparison' },
    { name: 'Reviews', description: 'Explorer pagination, search, flagged queue, resolution, and CSV export' },
    { name: 'Imports', description: 'Idempotent CSV/JSON review upload and batch audit history' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Check API and database health',
        responses: {
          '200': { description: 'Service and PostgreSQL database are healthy' },
          '503': { description: 'Database disconnected' },
        },
      },
    },
    '/properties': {
      get: {
        tags: ['Properties'],
        summary: 'List all hotel properties',
        responses: {
          '200': { description: 'Array of properties' },
        },
      },
    },
    '/analytics/overview': {
      get: {
        tags: ['Analytics'],
        summary: 'Get overview KPIs, period-over-period deltas, sparklines, and per-property breakdown',
        parameters: [
          { name: 'propertyId', in: 'query', schema: { type: 'string' }, description: 'Property UUID, slug, or "all"' },
          { name: 'preset', in: 'query', schema: { type: 'string', enum: ['30d', '90d', '12m', 'all'] } },
          { name: 'from', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'to', in: 'query', schema: { type: 'string', format: 'date' } },
        ],
        responses: {
          '200': { description: 'Overview KPI summary and per-property metrics' },
        },
      },
    },
    '/analytics/trends': {
      get: {
        tags: ['Analytics'],
        summary: 'Get average score and review volume time-series (weekly or monthly)',
        parameters: [
          { name: 'propertyId', in: 'query', schema: { type: 'string' } },
          { name: 'granularity', in: 'query', schema: { type: 'string', enum: ['weekly', 'monthly'] } },
          { name: 'preset', in: 'query', schema: { type: 'string', enum: ['30d', '90d', '12m', 'all'] } },
          { name: 'from', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'to', in: 'query', schema: { type: 'string', format: 'date' } },
        ],
        responses: {
          '200': { description: 'Time-series buckets' },
        },
      },
    },
    '/analytics/distribution': {
      get: {
        tags: ['Analytics'],
        summary: 'Get score histogram (1-10), trip-type breakdown, and guest-country breakdown',
        parameters: [
          { name: 'propertyId', in: 'query', schema: { type: 'string' } },
          { name: 'preset', in: 'query', schema: { type: 'string', enum: ['30d', '90d', '12m', 'all'] } },
          { name: 'from', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'to', in: 'query', schema: { type: 'string', format: 'date' } },
        ],
        responses: {
          '200': { description: 'Distributions payload' },
        },
      },
    },
    '/analytics/topics': {
      get: {
        tags: ['Analytics'],
        summary: 'Get rule-based topic sentiment insights ranked by strengths and weaknesses',
        parameters: [
          { name: 'propertyId', in: 'query', schema: { type: 'string' } },
          { name: 'preset', in: 'query', schema: { type: 'string', enum: ['30d', '90d', '12m', 'all'] } },
          { name: 'from', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'to', in: 'query', schema: { type: 'string', format: 'date' } },
        ],
        responses: {
          '200': { description: 'Topic insights payload' },
        },
      },
    },
    '/analytics/comparison': {
      get: {
        tags: ['Analytics'],
        summary: 'Compare 2-4 properties side-by-side across KPIs and topic radar metrics',
        parameters: [
          { name: 'propertyIds', in: 'query', schema: { type: 'string' }, description: 'Comma-separated property slugs or UUIDs' },
          { name: 'preset', in: 'query', schema: { type: 'string', enum: ['30d', '90d', '12m', 'all'] } },
          { name: 'from', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'to', in: 'query', schema: { type: 'string', format: 'date' } },
        ],
        responses: {
          '200': { description: 'Property comparison metrics and radar series' },
        },
      },
    },
    '/reviews': {
      get: {
        tags: ['Reviews'],
        summary: 'Search and filter reviews with server-side pagination',
        parameters: [
          { name: 'propertyId', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'minScore', in: 'query', schema: { type: 'number' } },
          { name: 'maxScore', in: 'query', schema: { type: 'number' } },
          { name: 'topic', in: 'query', schema: { type: 'string' } },
          { name: 'sentiment', in: 'query', schema: { type: 'string', enum: ['positive', 'neutral', 'negative'] } },
          { name: 'tripType', in: 'query', schema: { type: 'string' } },
          { name: 'sortBy', in: 'query', schema: { type: 'string', enum: ['review_date', 'score'] } },
          { name: 'sortOrder', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'] } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'pageSize', in: 'query', schema: { type: 'integer', default: 15 } },
        ],
        responses: {
          '200': { description: 'Paginated reviews list' },
        },
      },
    },
    '/reviews/export.csv': {
      get: {
        tags: ['Reviews'],
        summary: 'Export the current filtered view as an RFC-4180 CSV file',
        responses: {
          '200': {
            description: 'CSV file attachment',
            content: { 'text/csv': { schema: { type: 'string' } } },
          },
        },
      },
    },
    '/reviews/flagged': {
      get: {
        tags: ['Reviews'],
        summary: 'List flagged low-scoring reviews with unresolved/resolved counts',
        responses: {
          '200': { description: 'Flagged reviews queue' },
        },
      },
    },
    '/reviews/{id}': {
      get: {
        tags: ['Reviews'],
        summary: 'Get full review details including topic snippets and matched keywords',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'Full review detail' },
          '404': { description: 'Review not found' },
        },
      },
    },
    '/reviews/{id}/resolve': {
      patch: {
        tags: ['Reviews'],
        summary: 'Mark a flagged review as resolved or unresolved',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['resolved'],
                properties: {
                  resolved: { type: 'boolean' },
                  resolvedNotes: { type: 'string', nullable: true },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Updated review record' },
        },
      },
    },
    '/imports': {
      get: {
        tags: ['Imports'],
        summary: 'List recent import batches and error reports',
        responses: {
          '200': { description: 'List of import batches' },
        },
      },
      post: {
        tags: ['Imports'],
        summary: 'Idempotently import reviews via multipart CSV/JSON file upload or JSON payload',
        responses: {
          '201': { description: 'Import batch summary with row-level error report' },
        },
      },
    },
  },
};
