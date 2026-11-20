-- Up Migration

-- Enable required PostgreSQL extensions:
-- 1) pgcrypto: gen_random_uuid() for primary keys
-- 2) pg_trgm: GIN trigram indexing for fast substring & full-text search on reviews
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================================
-- 1. properties
-- Stores the 4 hotel properties analyzed in the dashboard
-- ============================================================================
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(160) NOT NULL,
  city VARCHAR(100) NOT NULL,
  country VARCHAR(100) NOT NULL,
  country_code CHAR(2) NOT NULL,
  star_rating SMALLINT NOT NULL CHECK (star_rating BETWEEN 1 AND 5),
  total_rooms INTEGER NOT NULL CHECK (total_rooms > 0),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 2. import_batches
-- Audit log for every seed run or CSV/JSON upload with row-level error report
-- ============================================================================
CREATE TABLE import_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename VARCHAR(255) NOT NULL,
  source_type VARCHAR(16) NOT NULL CHECK (source_type IN ('seed', 'csv', 'json')),
  total_rows INTEGER NOT NULL DEFAULT 0 CHECK (total_rows >= 0),
  imported_rows INTEGER NOT NULL DEFAULT 0 CHECK (imported_rows >= 0),
  duplicate_rows INTEGER NOT NULL DEFAULT 0 CHECK (duplicate_rows >= 0),
  failed_rows INTEGER NOT NULL DEFAULT 0 CHECK (failed_rows >= 0),
  error_report JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 3. reviews
-- Core guest reviews table (1.0 - 10.0 Booking.com score scale)
-- Deduplicated idempotently via external_id (when provided) or content_hash
-- ============================================================================
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  import_batch_id UUID REFERENCES import_batches(id) ON DELETE SET NULL,
  external_id VARCHAR(128),
  content_hash CHAR(64) NOT NULL,
  reviewer_name VARCHAR(120) NOT NULL,
  guest_country_code CHAR(2) NOT NULL,
  guest_country_name VARCHAR(100) NOT NULL,
  trip_type VARCHAR(32) NOT NULL CHECK (
    trip_type IN ('couple', 'family', 'solo', 'business', 'friends')
  ),
  room_type VARCHAR(100),
  stay_nights SMALLINT NOT NULL DEFAULT 1 CHECK (stay_nights >= 1 AND stay_nights <= 365),
  score NUMERIC(3, 1) NOT NULL CHECK (score >= 1.0 AND score <= 10.0),
  sentiment VARCHAR(16) NOT NULL CHECK (
    sentiment IN ('positive', 'neutral', 'negative')
  ),
  title VARCHAR(255) NOT NULL,
  positive_comment TEXT,
  negative_comment TEXT,
  full_text TEXT NOT NULL,
  review_date DATE NOT NULL,
  owner_response TEXT,
  owner_responded_at TIMESTAMPTZ,
  is_flagged BOOLEAN NOT NULL DEFAULT FALSE,
  is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_reviews_content_hash UNIQUE (content_hash)
);

-- Unique partial index so non-null external_id values are strictly unique
CREATE UNIQUE INDEX uq_reviews_external_id
  ON reviews (external_id)
  WHERE external_id IS NOT NULL;

-- ============================================================================
-- 4. review_topics
-- Rule-based topic tags & topic-level sentiment per review
-- Topics: cleanliness, staff, location, breakfast, wifi, noise, value, room_comfort
-- ============================================================================
CREATE TABLE review_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  topic VARCHAR(32) NOT NULL CHECK (
    topic IN (
      'cleanliness',
      'staff',
      'location',
      'breakfast',
      'wifi',
      'noise',
      'value',
      'room_comfort'
    )
  ),
  sentiment VARCHAR(16) NOT NULL CHECK (
    sentiment IN ('positive', 'neutral', 'negative')
  ),
  matched_keywords TEXT[] NOT NULL DEFAULT '{}',
  snippet TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_review_topics_review_topic UNIQUE (review_id, topic)
);

-- ============================================================================
-- Indexes for Analytical Queries, Filtering, and Full-Text/Substring Search
-- ============================================================================

-- Primary composite index for time-series trends & property-scoped filtering
CREATE INDEX idx_reviews_property_date
  ON reviews (property_id, review_date DESC);

-- Global date index for "All Properties" time-range queries
CREATE INDEX idx_reviews_date
  ON reviews (review_date DESC);

-- Score index for histogram distribution & score range filtering
CREATE INDEX idx_reviews_score
  ON reviews (score);

-- Sentiment index for KPI aggregations & explorer filter
CREATE INDEX idx_reviews_sentiment
  ON reviews (sentiment);

-- Partial index for the Flagged Reviews action queue
CREATE INDEX idx_reviews_flagged_queue
  ON reviews (property_id, is_resolved, review_date DESC)
  WHERE is_flagged = TRUE;

-- Trigram GIN index on full_text for fast ILIKE / substring search in Explorer
CREATE INDEX idx_reviews_full_text_trgm
  ON reviews USING GIN (full_text gin_trgm_ops);

-- Topic aggregation indexes
CREATE INDEX idx_review_topics_topic_sentiment
  ON review_topics (topic, sentiment);

CREATE INDEX idx_review_topics_review_id
  ON review_topics (review_id);


-- Down Migration

DROP TABLE IF EXISTS review_topics CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS import_batches CASCADE;
DROP TABLE IF EXISTS properties CASCADE;
