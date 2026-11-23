# Architecture & Design Decisions

This document records the key architectural and product decisions made while building the **Review Insights Dashboard**.

---

## ADR-001: npm Workspaces Monorepo Layout (`/apps/api`, `/apps/web`, `/infra`, `/docs`)

- **Context**: The project comprises a React 18 SPA, a Node 20 Express REST API, database migrations, and Docker orchestration that must work out-of-the-box with `docker compose up`.
- **Decision**: Use native **npm workspaces** at the repository root with a shared `tsconfig.base.json`, unified linting/formatting scripts, and isolated package manifests under `apps/api` and `apps/web`.
- **Rationale**:
  - Built directly into Node.js 20 (`npm` v10) with zero additional binary dependencies in local environments, Docker builds, or GitHub Actions CI.
  - Shared strict TypeScript compiler flags (`strict: true`, `noImplicitAny: true`, `noUncheckedIndexedAccess: true`) enforce type safety across both packages.

---

## ADR-002: Raw `pg` Pool + Versioned SQL Migrations (`node-pg-migrate`) Instead of an ORM

- **Context**: Analytics dashboards rely heavily on complex SQL aggregations (`FILTER (WHERE ...)`, `date_trunc`, percentile/histogram bucketing, window functions, and trigram GIN indexes).
- **Decision**: Use `pg` (`node-postgres`) with parameterized SQL queries inside a clean Repository layer, paired with `node-pg-migrate` for versioned `.sql` migrations (`-- Up Migration` / `-- Down Migration`).
- **Rationale**:
  - Heavy ORMs obscure query plans and force awkward workarounds for PostgreSQL-specific analytical features like `pg_trgm` GIN indexes, partial indexes, and multi-period KPI comparisons.
  - Explicit parameterized SQL (`$1, $2, ...`) guarantees SQL-injection safety while giving 100% control over index utilization and query latency.

---

## ADR-003: 1.0–10.0 Review Score Scale & Sentiment Thresholds

- **Context**: Hotel booking platforms (specifically Booking.com) rate properties on a **1.0 to 10.0** scale rather than a 1–5 star scale.
- **Decision**: Store review scores as `NUMERIC(3, 1)` constrained between `1.0` and `10.0`, with deterministic sentiment classification:
  - **Positive**: `score >= 8.0`
  - **Neutral**: `6.0 <= score < 8.0`
  - **Negative**: `score < 6.0`
- **Rationale**: Avoids floating-point rounding drift (`NUMERIC(3,1)` vs `FLOAT`) and aligns with hospitality industry benchmarks where scores below 6.0 signal guest dissatisfaction.

---

## ADR-004: Dual-Layer Idempotent Deduplication (`external_id` + `content_hash`)

- **Context**: Re-running the seed script or uploading overlapping CSV/JSON exports must be idempotent and never create duplicate reviews.
- **Decision**:
  1. A partial unique index `uq_reviews_external_id ON reviews (external_id) WHERE external_id IS NOT NULL` prevents duplicate imports when upstream review IDs exist.
  2. A deterministic SHA-256 `content_hash` computed from `(property_id, reviewer_name, review_date, score, full_text)` with a `UNIQUE` constraint catches duplicates even when `external_id` is omitted.
- **Rationale**: Supports both structured integrations (with external IDs) and ad-hoc CSV spreadsheet uploads without data duplication.

---

## ADR-005: Indexing Strategy for Sub-50ms Analytical Queries & Full-Text Search

- **Context**: The dashboard filters by property, date range, score range, topic, sentiment, and free-text search across all views.
- **Decision**:
  - `idx_reviews_property_date (property_id, review_date DESC)`: covers property-scoped KPIs and time-series trends.
  - `idx_reviews_score (score)`: covers score histogram and range slider queries.
  - `idx_reviews_full_text_trgm USING GIN (full_text gin_trgm_ops)`: uses PostgreSQL's `pg_trgm` extension to accelerate case-insensitive substring matching (`ILIKE '%term%'`) without sequential table scans.
  - `idx_reviews_flagged_queue (property_id, is_resolved, review_date DESC) WHERE is_flagged = TRUE`: partial index tailored specifically for the Flagged Reviews operational queue.

---

## ADR-006: Transparent Rule-Based Topic & Clause-Level Sentiment Engine

- **Context**: Product managers need to see which operational topics (`cleanliness`, `staff`, `location`, `breakfast`, `wifi`, `noise`, `value`, `room_comfort`) drive guest satisfaction or complaints without relying on opaque or paid external LLM calls.
- **Decision**: Implement a deterministic, clause-aware keyword + polarity lexicon analyzer (`apps/api/src/services/topicAnalyzer.ts`):
  1. Splits review text on sentence boundaries and contrast conjunctions (`but`, `however`, `although`, `yet`) so mixed reviews (e.g., *"Friendly staff, but slow wifi"*) score each topic independently.
  2. Combines section provenance (`positive_comment` vs `negative_comment`), topic-specific phrase rules, general sentiment tokens, and a 3-word lookbehind negation window (`not`, `no`, `never`, `hardly`, `wasn't`) that inverts polarity (e.g., *"not clean"* -> negative; *"no street noise"* -> positive).
  3. Persists `matched_keywords` and an extracted `snippet` per topic in `review_topics` for transparent auditability in the UI.
- **Trade-offs & Limits**: Cannot detect subtle sarcasm or implicit references lacking domain keywords; documented transparently in `README.md`.

---

## ADR-007: CSS Custom Property Design System & Theme-Aware Recharts

- **Context**: Analytics dashboards require high data density, strict visual hierarchy, WCAG AA contrast in both Light and Dark modes, and zero layout shift on numerical updates.
- **Decision**:
  - Define semantic CSS custom properties (`--bg-canvas`, `--bg-surface`, `--border-subtle`, `--text-primary`, `--brand-primary`, `--sentiment-pos/neu/neg`) in `apps/web/src/styles/globals.css` and map them into Tailwind utilities (`bg-canvas`, `bg-surface`, `text-content-primary`, etc.).
  - Apply `font-variant-numeric: tabular-nums` to all KPI figures, badges, deltas, and tables.
  - Drive Recharts grid, axis, and tooltip colors directly from `useTheme().resolvedTheme` and include a 1-click **Accessible Data Table** toggle on chart views.

---

## ADR-008: URL-Synced Filter State & Server-Side Pagination

- **Context**: Analysts frequently bookmark or share specific dashboard slices (e.g., *"Berlin Business Hotel • Last 90 Days • Wi-Fi complaints"*).
- **Decision**: Store global filters (`propertyId`, `preset`, `from`, `to`) and Explorer filters (`search`, `topic`, `sentiment`, `tripType`, `minScore`, `maxScore`, `sortBy`, `sortOrder`, `page`) in URL query parameters via `useSearchParams`, backed by parameterized server-side SQL pagination (`LIMIT $n OFFSET $m`).

---

## ADR-009: Free-Tier Cold Start Detection Banner

- **Context**: Free-tier cloud containers (such as Render's free web tier) spin down after 15 minutes of inactivity and take 15–30 seconds to wake up on the initial request.
- **Decision**: Track in-flight request latency inside `apps/web/src/lib/api.ts`. Whenever a request exceeds `2200ms`, broadcast a cold-start state to `<ColdStartBanner />` so the user sees an informative *"Waking up the API server..."* status banner alongside skeleton loaders instead of assuming the app is broken.


