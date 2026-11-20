import { logger } from '../config/logger';
import { upsertProperty } from '../repositories/propertyRepository';
import { processReviewImport } from '../services/importService';
import { ImportBatchResult } from '../types/domain';
import { pool } from './pool';
import { generateSeedReviews, SEED_PROPERTIES } from './seedData';

/**
 * Idempotently seed the 4 fictional hotel properties and ~620 realistic guest reviews.
 * Can be called programmatically in tests or executed directly via `npm run db:seed`.
 */
export async function runDatabaseSeed(): Promise<ImportBatchResult> {
  logger.info('Upserting 4 hotel properties...');
  for (const prop of SEED_PROPERTIES) {
    await upsertProperty(prop);
  }

  const rawRows = generateSeedReviews();
  logger.info({ rowCount: rawRows.length }, 'Generated realistic seed reviews across 18 months');

  const batchResult = await processReviewImport({
    filename: 'initial-18m-hotel-reviews-seed.json',
    sourceType: 'seed',
    rawRows,
  });

  logger.info(
    {
      batchId: batchResult.batchId,
      totalRows: batchResult.totalRows,
      importedRows: batchResult.importedRows,
      duplicateRows: batchResult.duplicateRows,
      failedRows: batchResult.failedRows,
    },
    'Database seed completed successfully'
  );

  return batchResult;
}

if (require.main === module) {
  runDatabaseSeed()
    .then(async (res) => {
      // eslint-disable-next-line no-console
      console.log(
        `Seed complete: ${res.importedRows} imported, ${res.duplicateRows} duplicates skipped, ${res.failedRows} failed.`
      );
      await pool.end();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('Seed failed:', err);
      await pool.end();
      process.exit(1);
    });
}
