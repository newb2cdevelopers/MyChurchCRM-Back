import { config } from 'dotenv';
import { MongoClient } from 'mongodb';

config();

const MONGO_URI = process.env.DEV_DB_CONNECTION;
const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
  if (!MONGO_URI) {
    console.error('ERROR: DEV_DB_CONNECTION environment variable is not set');

    process.exit(1);
  }

  console.log('========================================');
  console.log('Migration: Member status + compound index');
  console.log('Mode: ' + (DRY_RUN ? 'DRY RUN (--dry-run)' : 'EXECUTION'));
  console.log('========================================\n');

  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db();

  const membersCol = db.collection('members');

  // 1. Backfill existing members without status -> active
  const membersWithoutStatus = await membersCol
    .find({ status: { $exists: false } })
    .count();

  console.log(`  ${membersWithoutStatus} members without status`);

  if (membersWithoutStatus > 0 && !DRY_RUN) {
    const result = await membersCol.updateMany(
      { status: { $exists: false } },
      { $set: { status: 'active' } },
    );
    console.log(`  ✓ ${result.modifiedCount} set to active`);
  }

  // 2. Drop the old global unique index on documentNumber
  const indexes = await membersCol.indexes();

  for (const index of indexes) {
    const keys = Object.keys(index.key);

    if (keys.length === 1 && keys[0] === 'documentNumber' && index.unique) {
      console.log(`  Found old unique index "${index.name}" on documentNumber`);

      if (!DRY_RUN) {
        await membersCol.dropIndex(index.name);
        console.log(`  ✓ Dropped index "${index.name}"`);
      } else {
        console.log(`  (dry-run) would drop index "${index.name}"`);
      }
    }
  }

  // 3. Ensure the compound unique index (documentNumber + churchId)
  const hasCompound = indexes.some(
    (index) =>
      index.key.documentNumber === 1 &&
      index.key.churchId === 1 &&
      index.unique,
  );

  console.log(`  Compound index (documentNumber+churchId): ${hasCompound}`);

  if (!hasCompound && !DRY_RUN) {
    await membersCol.createIndex(
      { documentNumber: 1, churchId: 1 },
      { unique: true },
    );
    console.log('  ✓ Created compound unique index');
  }

  console.log('\nDone.');
  await client.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
