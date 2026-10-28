import { config } from 'dotenv';
import { MongoClient, ObjectId, Collection } from 'mongodb';
import { writeFile } from 'fs/promises';
import {
  normalizeDocument,
  normalizeEmail,
} from '../src/utils/normalization.util';

config();

type SourceName = 'members' | 'users' | 'students';

interface SourceRecord {
  _id: ObjectId;
  documentType?: string;
  documentNumber?: string;
  fullName?: string;
  name?: string;
  lastName?: string;
  birthDate?: Date;
  email?: string;
  mobilePhone?: string;
  landLine?: string;
  address?: string;
  housingType?: string;
  maritalStatus?: string;
  educationalLevel?: string;
  occupation?: string;
  churchId?: ObjectId;
  personId?: ObjectId;
  status?: string;
}

interface MigrationPlan {
  personId: ObjectId;
  candidate: PersonCandidate;
  entries: { source: SourceName; record: SourceRecord }[];
}

interface PersonCandidate {
  documentType: string;
  documentNumber: string;
  firstName: string;
  secondName?: string;
  firstLastName: string;
  secondLastName?: string;
  fullName: string;
  birthDate?: Date;
  email?: string;
  mobilePhone?: string;
  landLine?: string;
  address?: string;
  housingType?: string;
  maritalStatus?: string;
  educationalLevel?: string;
  occupation?: string;
  createdByChurchId?: ObjectId;
}

interface ConflictReport {
  type:
    | 'empty_document'
    | 'duplicate_document'
    | 'name_mismatch'
    | 'missing_name'
    | 'index_conflict';
  documentNumber?: string;
  sources: SourceName[];
  details: string;
}

interface MigrationReport {
  mode: 'dry-run' | 'write';
  generatedAt: string;
  personsCreated: number;
  profilesLinked: Record<SourceName, number>;
  skippedProfiles: Record<SourceName, number>;
  conflicts: ConflictReport[];
}

const sourceNames: SourceName[] = ['members', 'users', 'students'];
const mongoUri = process.env.DEV_DB_CONNECTION;
const isWriteMode = process.argv.includes('--write');
const reportArgumentIndex = process.argv.indexOf('--report');
const reportPath =
  reportArgumentIndex >= 0 ? process.argv[reportArgumentIndex + 1] : undefined;

function splitFullName(fullName?: string): {
  firstName: string;
  secondName?: string;
  firstLastName: string;
  secondLastName?: string;
} {
  const tokens = (fullName || '').trim().split(/\s+/).filter(Boolean);

  if (tokens.length < 2) {
    return {
      firstName: tokens[0] || '',
      firstLastName: '',
    };
  }

  if (tokens.length === 2) {
    return { firstName: tokens[0], firstLastName: tokens[1] };
  }

  if (tokens.length === 3) {
    return {
      firstName: tokens[0],
      firstLastName: tokens[1],
      secondLastName: tokens[2],
    };
  }

  return {
    firstName: tokens.slice(0, -3).join(' '),
    secondName: tokens[tokens.length - 3],
    firstLastName: tokens[tokens.length - 2],
    secondLastName: tokens[tokens.length - 1],
  };
}

function buildCandidate(
  record: SourceRecord,
  source: SourceName,
): PersonCandidate {
  const names =
    source === 'members'
      ? splitFullName(record.fullName)
      : {
          firstName: (record.name || '').trim(),
          firstLastName: (record.lastName || '').trim(),
        };
  const documentNumber = normalizeDocument(record.documentNumber || '');

  return {
    documentType: (record.documentType || 'CC').trim().toUpperCase(),
    documentNumber,
    ...names,
    fullName: [
      names.firstName,
      names.secondName,
      names.firstLastName,
      names.secondLastName,
    ]
      .filter(Boolean)
      .join(' '),
    birthDate: record.birthDate,
    email: record.email ? normalizeEmail(record.email) : undefined,
    mobilePhone: record.mobilePhone?.trim() || undefined,
    landLine: record.landLine?.trim() || undefined,
    address: record.address?.trim() || undefined,
    housingType: record.housingType?.trim() || undefined,
    maritalStatus: record.maritalStatus?.trim() || undefined,
    educationalLevel: record.educationalLevel?.trim() || undefined,
    occupation: record.occupation?.trim() || undefined,
    createdByChurchId: record.churchId,
  };
}

function getNameKey(candidate: PersonCandidate): string {
  return [
    candidate.firstName,
    candidate.secondName,
    candidate.firstLastName,
    candidate.secondLastName,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

async function loadRecords(
  collection: Collection<SourceRecord>,
): Promise<SourceRecord[]> {
  return collection.find({}).toArray();
}

function createEmptyReport(): MigrationReport {
  return {
    mode: isWriteMode ? 'write' : 'dry-run',
    generatedAt: new Date().toISOString(),
    personsCreated: 0,
    profilesLinked: { members: 0, users: 0, students: 0 },
    skippedProfiles: { members: 0, users: 0, students: 0 },
    conflicts: [],
  };
}

async function main(): Promise<void> {
  if (isWriteMode && process.argv.includes('--dry-run')) {
    throw new Error('Use either --dry-run or --write, not both');
  }
  if (reportArgumentIndex >= 0 && !reportPath) {
    throw new Error('--report requires a file path');
  }
  if (!mongoUri) {
    throw new Error('DEV_DB_CONNECTION environment variable is not set');
  }

  const client = new MongoClient(mongoUri);
  await client.connect();

  try {
    const db = client.db();
    const collections = {
      members: db.collection<SourceRecord>('members'),
      users: db.collection<SourceRecord>('users'),
      students: db.collection<SourceRecord>('students'),
      persons: db.collection<PersonCandidate & { status: string }>('persons'),
    };
    const report = createEmptyReport();
    const recordsByDocument = new Map<
      string,
      { source: SourceName; record: SourceRecord }[]
    >();

    for (const source of sourceNames) {
      const records = await loadRecords(collections[source]);

      for (const record of records) {
        const documentNumber = normalizeDocument(record.documentNumber || '');
        if (!documentNumber) {
          report.skippedProfiles[source] += 1;
          report.conflicts.push({
            type: 'empty_document',
            sources: [source],
            details: `Profile ${record._id.toString()} has no document number`,
          });
          continue;
        }

        const entries = recordsByDocument.get(documentNumber) || [];
        entries.push({ source, record });
        recordsByDocument.set(documentNumber, entries);
      }
    }

    const migrationPlans: MigrationPlan[] = [];

    for (const [documentNumber, entries] of recordsByDocument) {
      const sources = [...new Set(entries.map((entry) => entry.source))];
      if (entries.length > 1) {
        report.conflicts.push({
          type: 'duplicate_document',
          documentNumber,
          sources,
          details: `${entries.length} profiles share this normalized document`,
        });
      }

      const activeMembers = entries.filter(
        (entry) =>
          entry.source === 'members' &&
          (entry.record.status || 'active') === 'active',
      );
      if (activeMembers.length > 1) {
        report.conflicts.push({
          type: 'index_conflict',
          documentNumber,
          sources: ['members'],
          details:
            'Multiple active member profiles would violate members_one_active_person',
        });
      }

      for (const source of ['users', 'members', 'students'] as SourceName[]) {
        const sourceEntries = entries.filter(
          (entry) => entry.source === source,
        );
        const churchIds = sourceEntries
          .map((entry) => entry.record.churchId?.toString())
          .filter(Boolean);
        const hasDuplicateChurchProfile =
          churchIds.length > 0 && new Set(churchIds).size !== churchIds.length;

        if (source === 'users' && sourceEntries.length > 1) {
          report.conflicts.push({
            type: 'index_conflict',
            documentNumber,
            sources: ['users'],
            details: 'Multiple user profiles would violate users_person_unique',
          });
        }

        if (
          (source === 'members' || source === 'students') &&
          hasDuplicateChurchProfile
        ) {
          report.conflicts.push({
            type: 'index_conflict',
            documentNumber,
            sources: [source],
            details: `Multiple ${source} profiles share the same church and would violate the personId + churchId unique index`,
          });
        }
      }

      const primaryEntry =
        entries.find((entry) => entry.source === 'members') ||
        entries.find((entry) => entry.source === 'users') ||
        entries[0];
      const primaryCandidate = buildCandidate(
        primaryEntry.record,
        primaryEntry.source,
      );

      if (!primaryCandidate.firstName || !primaryCandidate.firstLastName) {
        report.conflicts.push({
          type: 'missing_name',
          documentNumber,
          sources,
          details: `Primary profile ${primaryEntry.record._id.toString()} has incomplete name`,
        });
        continue;
      }

      const nameKeys = new Set(
        entries.map((entry) =>
          getNameKey(buildCandidate(entry.record, entry.source)),
        ),
      );
      if (nameKeys.size > 1) {
        report.conflicts.push({
          type: 'name_mismatch',
          documentNumber,
          sources,
          details: 'Profiles with the same document have different names',
        });
      }

      const existingPerson = await collections.persons.findOne({
        documentNumber,
      });

      const personId = (existingPerson?._id as ObjectId) || new ObjectId();
      if (!existingPerson) {
        report.personsCreated += 1;
      }

      for (const entry of entries) {
        report.profilesLinked[entry.source] += 1;
      }
      migrationPlans.push({ personId, candidate: primaryCandidate, entries });
    }

    console.log(
      `[backfill-persons] Preflight complete: ${report.conflicts.length} conflicts detected`,
    );
    console.log(
      JSON.stringify(
        { phase: 'preflight', conflicts: report.conflicts },
        null,
        2,
      ),
    );

    const blockingConflicts = report.conflicts.filter(
      (conflict) => conflict.type === 'index_conflict',
    );
    if (isWriteMode && blockingConflicts.length > 0) {
      throw new Error(
        `[backfill-persons] Aborted before writing: ${blockingConflicts.length} index conflicts require review`,
      );
    }

    if (isWriteMode) {
      for (const plan of migrationPlans) {
        const existingPerson = await collections.persons.findOne({
          _id: plan.personId,
        });
        if (!existingPerson) {
          await collections.persons.insertOne({
            _id: plan.personId,
            ...plan.candidate,
            status: 'active',
          });
        }

        for (const entry of plan.entries) {
          await collections[entry.source].updateOne(
            { _id: entry.record._id },
            { $set: { personId: plan.personId } },
          );
        }
      }
    }

    if (isWriteMode) {
      await Promise.all([
        collections.members.createIndex(
          { personId: 1, churchId: 1 },
          {
            unique: true,
            partialFilterExpression: { personId: { $exists: true } },
            name: 'members_person_church_unique',
          },
        ),
        collections.members.createIndex(
          { personId: 1 },
          {
            unique: true,
            partialFilterExpression: {
              personId: { $exists: true },
              status: 'active',
            },
            name: 'members_one_active_person',
          },
        ),
        collections.users.createIndex(
          { personId: 1 },
          {
            unique: true,
            partialFilterExpression: { personId: { $exists: true } },
            name: 'users_person_unique',
          },
        ),
        collections.students.createIndex(
          { personId: 1, churchId: 1 },
          {
            unique: true,
            partialFilterExpression: { personId: { $exists: true } },
            name: 'students_person_church_unique',
          },
        ),
      ]);
    }

    if (reportPath) {
      await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
    }

    console.log(JSON.stringify(report, null, 2));
  } finally {
    await client.close();
  }
}

main().catch((error: Error) => {
  console.error(`[backfill-persons] ${error.message}`);
  process.exitCode = 1;
});
