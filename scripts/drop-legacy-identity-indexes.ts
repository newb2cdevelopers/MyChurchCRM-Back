import { config } from 'dotenv';
import { MongoClient } from 'mongodb';

config();

interface LegacyIndex {
  collection: string;
  index: string;
  reason: string;
}

/**
 * Unique indexes that belong to identity fields no longer written to the
 * profile collections. If they remain, documents without those fields are
 * treated as duplicates (missing value == null).
 */
const LEGACY_INDEXES: LegacyIndex[] = [
  {
    collection: 'users',
    index: 'documentNumber_1',
    reason: 'users.documentNumber moved to persons',
  },
  {
    collection: 'members',
    index: 'documentNumber_1_churchId_1',
    reason: 'members.documentNumber moved to persons',
  },
  {
    collection: 'members',
    index: 'documentNumber_1',
    reason: 'legacy unique index on members.documentNumber',
  },
  {
    collection: 'students',
    index: 'documentNumber_1_churchId_1',
    reason: 'students.documentNumber moved to persons',
  },
];

const mongoUri = process.env.DEV_DB_CONNECTION;
const isWriteMode = process.argv.includes('--write');

async function main(): Promise<void> {
  if (!mongoUri) {
    throw new Error('DEV_DB_CONNECTION environment variable is not set');
  }

  const client = new MongoClient(mongoUri);
  await client.connect();

  try {
    const db = client.db();
    const report = {
      mode: isWriteMode ? 'write' : 'dry-run',
      dropped: [] as string[],
      missing: [] as string[],
      errors: [] as string[],
    };

    for (const legacy of LEGACY_INDEXES) {
      const collection = db.collection(legacy.collection);
      const indexes = await collection.indexes();
      const exists = indexes.some((index) => index.name === legacy.index);

      if (!exists) {
        report.missing.push(`${legacy.collection}.${legacy.index}`);
        continue;
      }

      if (!isWriteMode) {
        report.dropped.push(`${legacy.collection}.${legacy.index} (dry-run)`);
        continue;
      }

      try {
        await collection.dropIndex(legacy.index);
        report.dropped.push(`${legacy.collection}.${legacy.index}`);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        report.errors.push(
          `${legacy.collection}.${legacy.index}: ${err.message}`,
        );
      }
    }

    console.log(JSON.stringify({ ...report, plan: LEGACY_INDEXES }, null, 2));
  } finally {
    await client.close();
  }
}

main().catch((error: Error) => {
  console.error(`[drop-legacy-identity-indexes] ${error.message}`);
  process.exitCode = 1;
});
