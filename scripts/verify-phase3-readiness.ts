import { config } from 'dotenv';
import { MongoClient, ObjectId, Collection } from 'mongodb';
import { writeFile } from 'fs/promises';
import { normalizeDocument } from '../src/utils/normalization.util';

config();

interface ReadinessReport {
  generatedAt: string;
  database: string;
  collections: {
    persons: CollectionStats;
    members: MemberStats;
    users: UserStats;
    students: StudentStats;
    familyGroups: FamilyGroupStats;
  };
  loginRisk: {
    usersWithoutPersonId: number;
    usersWithDocumentAndNoPerson: number;
    sampleUserIds: string[];
  };
  duplicateDocuments: {
    documentNumber: string;
    sources: string[];
    count: number;
  }[];
  warnings: string[];
}

interface CollectionStats {
  total: number;
  withPersonId: number;
  withoutPersonId: number;
  merged: number;
}

interface MemberStats extends CollectionStats {
  withRelatives: number;
  withWorkFronts: number;
  withAdditionalAcademicStudies: number;
  active: number;
  inactive: number;
}

interface UserStats extends CollectionStats {
  withMemberId: number;
  withDocumentNumber: number;
  withoutDocumentNumber: number;
  withRegistrationSnapshot: number;
  pending: number;
}

interface StudentStats extends CollectionStats {
  withLevelId: number;
  withoutLevelId: number;
  graduated: number;
}

interface FamilyGroupStats {
  total: number;
  withMembers: number;
  totalEmbeddedMembers: number;
  distinctDocumentNumbers: number;
}

type SourceName = 'members' | 'users' | 'students';

interface SourceRecord {
  _id: ObjectId;
  documentNumber?: string;
  personId?: ObjectId;
  churchId?: ObjectId;
  status?: string;
  levelId?: ObjectId;
  graduated?: boolean;
  relatives?: unknown[];
  workFronts?: unknown[];
  additionalAcademicStudies?: unknown[];
  memberId?: ObjectId;
  registrationSnapshot?: unknown;
}

const mongoUri = process.env.DEV_DB_CONNECTION;
const reportArgumentIndex = process.argv.indexOf('--report');
const reportPath =
  reportArgumentIndex >= 0 ? process.argv[reportArgumentIndex + 1] : undefined;

async function main(): Promise<void> {
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
    const members = db.collection<SourceRecord>('members');
    const users = db.collection<SourceRecord>('users');
    const students = db.collection<SourceRecord>('students');
    const persons = db.collection('persons');
    const familyGroups = db.collection('familygroups');

    const warnings: string[] = [];

    const [
      personsTotal,
      personsMerged,
      membersTotal,
      membersWithPerson,
      membersWithRelatives,
      membersWithWorkFronts,
      membersWithAcademic,
      membersActive,
      usersTotal,
      usersWithPerson,
      usersWithMemberId,
      usersWithDocument,
      usersWithSnapshot,
      usersPending,
      studentsTotal,
      studentsWithPerson,
      studentsWithLevel,
      studentsGraduated,
      familyGroupsTotal,
      familyGroupsWithMembers,
    ] = await Promise.all([
      persons.countDocuments({}),
      persons.countDocuments({ status: 'merged' }),
      members.countDocuments({}),
      members.countDocuments({ personId: { $exists: true, $ne: null } }),
      members.countDocuments({ 'relatives.0': { $exists: true } }),
      members.countDocuments({ 'workFronts.0': { $exists: true } }),
      members.countDocuments({
        'additionalAcademicStudies.0': { $exists: true },
      }),
      members.countDocuments({ status: 'active' }),
      users.countDocuments({}),
      users.countDocuments({ personId: { $exists: true, $ne: null } }),
      users.countDocuments({ memberId: { $exists: true, $ne: null } }),
      users.countDocuments({ documentNumber: { $exists: true, $ne: null } }),
      users.countDocuments({
        registrationSnapshot: { $exists: true, $ne: null },
      }),
      users.countDocuments({ status: 'pending' }),
      students.countDocuments({}),
      students.countDocuments({ personId: { $exists: true, $ne: null } }),
      students.countDocuments({ levelId: { $exists: true, $ne: null } }),
      students.countDocuments({ graduated: true }),
      familyGroups.countDocuments({}),
      familyGroups.countDocuments({ 'members.0': { $exists: true } }),
    ]);

    const embeddedMembers = await familyGroups
      .aggregate<{ total: number; documents: string[] }>([
        { $unwind: '$members' },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            documents: { $addToSet: '$members.documentNumber' },
          },
        },
      ])
      .toArray();

    const totalEmbeddedMembers = embeddedMembers[0]?.total || 0;
    const distinctDocumentNumbers = embeddedMembers[0]?.documents?.length || 0;

    const usersWithDocumentAndNoPerson = await users.countDocuments({
      documentNumber: { $exists: true, $ne: null },
      $or: [{ personId: { $exists: false } }, { personId: null }],
    });

    const sampleUsers = await users
      .find({
        documentNumber: { $exists: true, $ne: null },
        $or: [{ personId: { $exists: false } }, { personId: null }],
      })
      .project({ _id: 1 })
      .limit(20)
      .toArray();

    const recordsByDocument = new Map<string, Set<SourceName>>();
    for (const [source, collection] of [
      ['members', members],
      ['users', users],
      ['students', students],
    ] as [SourceName, Collection<SourceRecord>][]) {
      const records = await collection
        .find({ documentNumber: { $exists: true, $ne: null } })
        .project({ documentNumber: 1 })
        .toArray();

      for (const record of records) {
        const normalized = normalizeDocument(record.documentNumber || '');
        if (!normalized) continue;
        const sources =
          recordsByDocument.get(normalized) || new Set<SourceName>();
        sources.add(source);
        recordsByDocument.set(normalized, sources);
      }
    }

    const duplicateDocuments = [...recordsByDocument.entries()]
      .filter(([, sources]) => sources.size > 1)
      .map(([documentNumber, sources]) => ({
        documentNumber,
        sources: [...sources].sort(),
        count: sources.size,
      }))
      .sort((a, b) => a.documentNumber.localeCompare(b.documentNumber));

    if (membersWithWorkFronts > 0) {
      warnings.push(
        `${membersWithWorkFronts} member documents still contain data in workFronts[]; archive before deleting the field`,
      );
    }

    if (usersWithDocumentAndNoPerson > 0) {
      warnings.push(
        `${usersWithDocumentAndNoPerson} users have documentNumber but no personId; login by document would break if users.documentNumber is removed`,
      );
    }

    if (studentsWithLevel > 0 && studentsWithPerson === 0) {
      warnings.push(
        'students have levelId but none has personId; run resolveOrCreate during Phase 3.3',
      );
    }

    const report: ReadinessReport = {
      generatedAt: new Date().toISOString(),
      database: db.databaseName,
      collections: {
        persons: {
          total: personsTotal,
          withPersonId: personsTotal,
          withoutPersonId: 0,
          merged: personsMerged,
        },
        members: {
          total: membersTotal,
          withPersonId: membersWithPerson,
          withoutPersonId: membersTotal - membersWithPerson,
          merged: 0,
          withRelatives: membersWithRelatives,
          withWorkFronts: membersWithWorkFronts,
          withAdditionalAcademicStudies: membersWithAcademic,
          active: membersActive,
          inactive: membersTotal - membersActive,
        },
        users: {
          total: usersTotal,
          withPersonId: usersWithPerson,
          withoutPersonId: usersTotal - usersWithPerson,
          merged: 0,
          withMemberId: usersWithMemberId,
          withDocumentNumber: usersWithDocument,
          withoutDocumentNumber: usersTotal - usersWithDocument,
          withRegistrationSnapshot: usersWithSnapshot,
          pending: usersPending,
        },
        students: {
          total: studentsTotal,
          withPersonId: studentsWithPerson,
          withoutPersonId: studentsTotal - studentsWithPerson,
          merged: 0,
          withLevelId: studentsWithLevel,
          withoutLevelId: studentsTotal - studentsWithLevel,
          graduated: studentsGraduated,
        },
        familyGroups: {
          total: familyGroupsTotal,
          withMembers: familyGroupsWithMembers,
          totalEmbeddedMembers,
          distinctDocumentNumbers,
        },
      },
      loginRisk: {
        usersWithoutPersonId: usersTotal - usersWithPerson,
        usersWithDocumentAndNoPerson,
        sampleUserIds: sampleUsers.map((user) => user._id.toString()),
      },
      duplicateDocuments,
      warnings,
    };

    if (reportPath) {
      await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
    }

    console.log(JSON.stringify(report, null, 2));
  } finally {
    await client.close();
  }
}

main().catch((error: Error) => {
  console.error(`[verify-phase3-readiness] ${error.message}`);
  process.exitCode = 1;
});
