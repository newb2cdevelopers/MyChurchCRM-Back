import { config } from 'dotenv';
import { MongoClient, ObjectId } from 'mongodb';

config();

/**
 * Phase 3 cleanup: removes the legacy duplicated data that now lives in the
 * canonical `persons` collection (or is dead data).
 *
 * - members:  workFronts[] (dead data) and the identity/personal fields that
 *             were moved to persons.
 * - students: identity fields moved to persons (guardian data is preserved).
 * - users:    identity fields moved to persons and the redundant memberId
 *             (users are linked through personId).
 *
 * Usage:
 *   npx ts-node scripts/cleanup-phase3-legacy-fields.ts          # dry run
 *   npx ts-node scripts/cleanup-phase3-legacy-fields.ts --write  # apply
 */

const MEMBER_LEGACY_FIELDS = [
  'workFronts',
  'address',
  'birthDate',
  'documentNumber',
  'documentType',
  'educationalLevel',
  'email',
  'fullName',
  'housingType',
  'landLine',
  'maritalStatus',
  'mobilePhone',
  'occupation',
];

const STUDENT_LEGACY_FIELDS = [
  'name',
  'lastName',
  'documentType',
  'documentNumber',
  'birthDate',
];

const USER_LEGACY_FIELDS = [
  'name',
  'lastName',
  'documentType',
  'documentNumber',
  'memberId',
];

interface ProfileCollectionConfig {
  name: 'members' | 'students' | 'users';
  fields: string[];
}

const COLLECTIONS: ProfileCollectionConfig[] = [
  { name: 'members', fields: MEMBER_LEGACY_FIELDS },
  { name: 'students', fields: STUDENT_LEGACY_FIELDS },
  { name: 'users', fields: USER_LEGACY_FIELDS },
];

const isWriteMode = process.argv.includes('--write');

function buildUnset(fields: string[]): Record<string, 1> {
  return fields.reduce<Record<string, 1>>((acc, field) => {
    acc[field] = 1;
    return acc;
  }, {});
}

function toId(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof ObjectId) return value.toString();
  if (typeof value === 'object' && '_id' in (value as object)) {
    return String((value as { _id: unknown })._id);
  }
  return String(value);
}

async function main(): Promise<void> {
  const connection = process.env.DEV_DB_CONNECTION;

  if (!connection) {
    throw new Error('DEV_DB_CONNECTION is not defined');
  }

  const client = new MongoClient(connection);

  try {
    await client.connect();
    const db = client.db();

    console.log(
      `[cleanup-phase3] Mode: ${isWriteMode ? 'WRITE' : 'DRY RUN'} | DB: ${
        db.databaseName
      }`,
    );

    const personIds = new Set(
      (
        await db.collection('persons').find({}).project({ _id: 1 }).toArray()
      ).map((person) => String(person._id)),
    );

    const memberPersonById = new Map<string, string>();

    if (COLLECTIONS.some((collection) => collection.name === 'users')) {
      const members = await db
        .collection('members')
        .find({})
        .project({ _id: 1, personId: 1 })
        .toArray();

      for (const member of members) {
        memberPersonById.set(String(member._id), toId(member.personId) || '');
      }
    }

    for (const { name, fields } of COLLECTIONS) {
      const collection = db.collection(name);
      const documents = await collection.find({}).toArray();

      const missingPersonId: string[] = [];
      const missingPerson: string[] = [];
      const missingPersonalData: string[] = [];
      const redundantMemberMismatch: string[] = [];
      const withLegacyData: string[] = [];

      for (const document of documents) {
        const documentId = String(document._id);
        const personId = toId(document.personId);

        if (!personId) {
          missingPersonId.push(documentId);
          continue;
        }

        if (!personIds.has(personId)) {
          missingPerson.push(`${documentId} -> ${personId}`);
          continue;
        }

        const hasLegacyData = fields.some(
          (field) => document[field] !== undefined && document[field] !== null,
        );

        if (hasLegacyData) {
          withLegacyData.push(documentId);
        }

        if (name === 'members') {
          const person = await db
            .collection('persons')
            .findOne({ _id: new ObjectId(personId) });

          const missingFields = fields.filter((field) => {
            if (field === 'workFronts') return false;
            const legacyValue = document[field];
            if (legacyValue === undefined || legacyValue === null) return false;
            if (legacyValue === '') return false;
            return person?.[field] === undefined || person?.[field] === null;
          });

          if (missingFields.length) {
            missingPersonalData.push(
              `${documentId} -> missing in person: ${missingFields.join(', ')}`,
            );
          }
        }

        if (name === 'users' && document.memberId) {
          const memberPersonId = memberPersonById.get(
            String(document.memberId),
          );

          if (memberPersonId !== personId) {
            redundantMemberMismatch.push(
              `${documentId} -> member ${document.memberId} person ${
                memberPersonId || 'n/a'
              } vs user person ${personId}`,
            );
          }
        }
      }

      console.log(`\n[cleanup-phase3] ${name}`);
      console.log(`  documents: ${documents.length}`);
      console.log(`  with legacy data: ${withLegacyData.length}`);
      console.log(`  missing personId: ${missingPersonId.length}`);
      console.log(`  person not found: ${missingPerson.length}`);
      console.log(
        `  personal data missing in person: ${missingPersonalData.length}`,
      );
      console.log(`  memberId mismatches: ${redundantMemberMismatch.length}`);

      if (missingPersonId.length) {
        console.log(
          `  sample missing personId: ${missingPersonId
            .slice(0, 5)
            .join(', ')}`,
        );
      }

      if (missingPerson.length) {
        console.log(
          `  sample missing person: ${missingPerson.slice(0, 5).join(' | ')}`,
        );
      }

      if (missingPersonalData.length) {
        console.log(
          `  sample missing personal data: ${missingPersonalData
            .slice(0, 5)
            .join(' | ')}`,
        );
      }

      if (redundantMemberMismatch.length) {
        console.log(
          `  sample memberId mismatch: ${redundantMemberMismatch
            .slice(0, 5)
            .join(' | ')}`,
        );
      }

      if (missingPersonId.length || missingPerson.length) {
        throw new Error(
          `[cleanup-phase3] Aborting ${name}: every document must reference an existing person`,
        );
      }

      if (name === 'members' && missingPersonalData.length) {
        throw new Error(
          '[cleanup-phase3] Aborting members: some personal fields are not present in persons',
        );
      }

      if (name === 'users' && redundantMemberMismatch.length) {
        throw new Error(
          '[cleanup-phase3] Aborting users: memberId does not match personId',
        );
      }

      if (!isWriteMode) {
        console.log(`  [dry-run] would unset: ${fields.join(', ')}`);
        continue;
      }

      const result = await collection.updateMany(
        {},
        { $unset: buildUnset(fields) },
      );

      console.log(`  updated: ${result.modifiedCount}`);
    }

    if (!isWriteMode) {
      console.log(
        '\n[cleanup-phase3] Dry run finished. Re-run with --write to apply the changes.',
      );
    } else {
      console.log('\n[cleanup-phase3] Cleanup applied successfully.');
    }
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(
    `[cleanup-phase3] ${
      error instanceof Error ? error.message : String(error)
    }`,
  );
  process.exit(1);
});
