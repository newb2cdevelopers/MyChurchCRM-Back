import { config } from 'dotenv';
import { MongoClient, ObjectId } from 'mongodb';
import { writeFile } from 'fs/promises';
import {
  normalizeDocument,
  normalizeEmail,
} from '../src/utils/normalization.util';

config();

interface EmbeddedMember {
  _id?: ObjectId;
  name?: string;
  documentNumber?: string;
  documentType?: string;
  address?: string;
  mobilePhone?: string;
  email?: string;
  birthDate?: Date | string;
  startingDate?: string;
  comments?: string;
}

interface FamilyGroupRecord {
  _id: ObjectId;
  churchId?: ObjectId;
  code?: string;
  members?: EmbeddedMember[];
}

interface PersonRecord {
  _id: ObjectId;
  documentNumber: string;
  status?: string;
  mergedInto?: ObjectId;
}

interface MembershipRecord {
  _id: ObjectId;
  familyGroupId: ObjectId;
  churchId: ObjectId;
  personId: ObjectId;
  startingDate?: string;
  comments?: string;
  status: 'active' | 'inactive';
}

interface BackfillReport {
  mode: 'dry-run' | 'write';
  generatedAt: string;
  groupsScanned: number;
  embeddedMembersScanned: number;
  membershipsAlreadyPresent: number;
  personsFound: number;
  personsCreated: number;
  membershipsToCreate: number;
  membershipsCreated: number;
  duplicateConflicts: number;
  skippedWithoutDocument: number;
  skippedWithoutChurch: number;
  errors: string[];
}

const mongoUri = process.env.DEV_DB_CONNECTION;
const isWriteMode = process.argv.includes('--write');
const reportArgumentIndex = process.argv.indexOf('--report');
const reportPath =
  reportArgumentIndex >= 0 ? process.argv[reportArgumentIndex + 1] : undefined;

function splitFullName(name?: string): {
  firstName: string;
  firstLastName?: string;
} {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);

  return {
    firstName: parts[0] || '',
    firstLastName: parts.slice(1).join(' ') || undefined,
  };
}

function toDate(value?: Date | string): Date | undefined {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
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
    const groups = db.collection<FamilyGroupRecord>('familygroups');
    const persons = db.collection<PersonRecord>('persons');
    const memberships = db.collection<MembershipRecord>(
      'familyGroupMemberships',
    );

    const report: BackfillReport = {
      mode: isWriteMode ? 'write' : 'dry-run',
      generatedAt: new Date().toISOString(),
      groupsScanned: 0,
      embeddedMembersScanned: 0,
      membershipsAlreadyPresent: 0,
      personsFound: 0,
      personsCreated: 0,
      membershipsToCreate: 0,
      membershipsCreated: 0,
      duplicateConflicts: 0,
      skippedWithoutDocument: 0,
      skippedWithoutChurch: 0,
      errors: [],
    };

    const cursor = groups.find({});

    for await (const group of cursor) {
      report.groupsScanned += 1;

      if (!group.churchId) {
        report.skippedWithoutChurch += (group.members || []).length;
        report.errors.push(
          `Group ${group._id.toString()} has members but no churchId`,
        );
        continue;
      }

      for (const member of group.members || []) {
        report.embeddedMembersScanned += 1;

        const normalizedDoc = normalizeDocument(member.documentNumber || '');

        if (!normalizedDoc) {
          report.skippedWithoutDocument += 1;
          report.errors.push(
            `Group ${group._id.toString()} has a member without document number`,
          );
          continue;
        }

        const membershipId = member._id || new ObjectId();

        const alreadyPresent = await memberships.findOne({
          _id: membershipId,
        });

        if (alreadyPresent) {
          report.membershipsAlreadyPresent += 1;
          continue;
        }

        let person = await persons.findOne({ documentNumber: normalizedDoc });

        if (person?.status === 'merged' && person.mergedInto) {
          person = await persons.findOne({ _id: person.mergedInto });
        }

        if (person) {
          report.personsFound += 1;
        } else {
          const { firstName, firstLastName } = splitFullName(member.name);
          const fullName = [firstName, firstLastName].filter(Boolean).join(' ');

          const newPerson = {
            documentType: member.documentType,
            documentNumber: normalizedDoc,
            firstName,
            firstLastName,
            fullName,
            birthDate: toDate(member.birthDate),
            email: member.email ? normalizeEmail(member.email) : undefined,
            mobilePhone: member.mobilePhone,
            address: member.address,
            createdByChurchId: group.churchId,
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          report.personsCreated += 1;

          if (isWriteMode) {
            const result = await persons.insertOne(
              newPerson as unknown as PersonRecord,
            );
            person = {
              _id: result.insertedId,
              documentNumber: normalizedDoc,
              status: 'active',
            };
          }
        }

        if (!person && !isWriteMode) {
          // In dry-run mode the person does not exist yet; simulate the
          // membership so counts remain meaningful.
          report.membershipsToCreate += 1;
          continue;
        }

        const duplicate = await memberships.findOne({
          _id: { $ne: membershipId },
          churchId: group.churchId,
          personId: person?._id,
          status: 'active',
        });

        if (duplicate) {
          report.duplicateConflicts += 1;
        }

        report.membershipsToCreate += 1;

        if (!isWriteMode) {
          continue;
        }

        const membership: MembershipRecord = {
          _id: membershipId,
          familyGroupId: group._id,
          churchId: group.churchId,
          personId: person?._id as ObjectId,
          startingDate: member.startingDate,
          comments: duplicate
            ? [member.comments, 'Duplicado detectado durante la migración']
                .filter(Boolean)
                .join(' | ')
            : member.comments,
          status: duplicate ? 'inactive' : 'active',
        };

        try {
          await memberships.insertOne(membership);
          report.membershipsCreated += 1;
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          report.errors.push(
            `Membership ${membershipId.toString()}: ${err.message}`,
          );
        }
      }
    }

    if (isWriteMode) {
      // Names intentionally match Mongoose's auto-generated names so this is
      // idempotent when the backend has already created the indexes.
      await memberships.createIndex({ familyGroupId: 1, status: 1 });
      await memberships.createIndex({ personId: 1 });
      await memberships.createIndex(
        { churchId: 1, personId: 1 },
        {
          unique: true,
          partialFilterExpression: { status: 'active' },
          name: 'family_group_one_active_membership_per_person',
        },
      );
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
  console.error(`[backfill-family-group-memberships] ${error.message}`);
  process.exitCode = 1;
});
