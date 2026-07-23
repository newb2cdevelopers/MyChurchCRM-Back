import { config } from 'dotenv';
import { MongoClient } from 'mongodb';

config();

const MONGO_URI = process.env.DEV_DB_CONNECTION;
const DRY_RUN = process.argv.includes('--dry-run');

interface MatchResult {
  email: string;
  userDocNum: string | null;
  memberName: string;
  memberDocNum: string;
  result: 'linked' | 'duplicated_email' | 'no_member';
}

interface DuplicatedEmail {
  _id: string;
  count: number;
  members: { fullName: string; documentNumber: string }[];
}

async function main() {
  if (!MONGO_URI) {
    console.error('ERROR: DEV_DB_CONNECTION environment variable is not set');

    process.exit(1);
  }

  console.log('========================================');
  console.log('Backfill: Users ← Members');
  console.log('Mode: ' + (DRY_RUN ? 'DRY RUN (--dry-run)' : 'EXECUTION'));
  console.log('========================================\n');

  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db();

  const report = {
    membersDocTypeFixed: 0,
    linked: [] as MatchResult[],
    skipped: [] as MatchResult[],
  };

  // =========================================
  // PHASE 1: Members without documentType → 'CC'
  // =========================================

  console.log('--- PHASE 1: Members without documentType ---');

  const membersWithoutDocType = await db
    .collection('members')
    .find({
      $or: [
        { documentType: { $exists: false } },
        { documentType: null },
        { documentType: '' },
      ],
    })
    .project({ fullName: 1, documentNumber: 1 })
    .toArray();

  if (membersWithoutDocType.length === 0) {
    console.log('  ✓ All Members have documentType\n');
  } else {
    console.log(
      `  ${membersWithoutDocType.length} Members without documentType:`,
    );

    for (const member of membersWithoutDocType) {
      console.log(`    ${member.fullName} (${member.documentNumber}) → CC`);
    }

    if (!DRY_RUN) {
      const result = await db.collection('members').updateMany(
        {
          $or: [
            { documentType: { $exists: false } },
            { documentType: null },
            { documentType: '' },
          ],
        },
        { $set: { documentType: 'CC' } },
      );

      report.membersDocTypeFixed = result.modifiedCount;

      console.log(`  ✓ ${result.modifiedCount} updated`);
    } else {
      report.membersDocTypeFixed = membersWithoutDocType.length;

      console.log('  → (dry-run, no changes)');
    }

    console.log();
  }

  // =========================================
  // PHASE 2: Link Users with Members by email
  // =========================================

  console.log('--- PHASE 2: Link Users with Members by email ---');

  // Find duplicated emails in Members (appear in 2+ members)
  const duplicatedEmailsRaw = await db
    .collection('members')
    .aggregate([
      { $match: { email: { $exists: true, $nin: [null, ''] } } },
      {
        $group: {
          _id: '$email',
          count: { $sum: 1 },
          members: {
            $push: { fullName: '$fullName', documentNumber: '$documentNumber' },
          },
        },
      },
      { $match: { count: { $gt: 1 } } },
    ])
    .toArray();

  const duplicatedEmails = duplicatedEmailsRaw as unknown as DuplicatedEmail[];

  const duplicatedEmailSet = new Set(duplicatedEmails.map((e) => e._id));

  if (duplicatedEmails.length > 0) {
    console.log(`  Duplicated emails in Members (${duplicatedEmails.length}):`);

    for (const entry of duplicatedEmails) {
      const members = entry.members.map(
        (m) => `${m.fullName} (${m.documentNumber})`,
      );

      console.log(`    ${entry._id} → ${members.join(' | ')}`);
    }

    console.log();
  }

  // Find Users without memberId that have an email
  const usersWithoutMemberId = await db
    .collection('users')
    .find({
      memberId: { $exists: false },
      email: { $exists: true, $nin: [null, ''] },
    })
    .project({ email: 1, documentNumber: 1 })
    .toArray();

  console.log(
    `  Users without memberId with email: ${usersWithoutMemberId.length}`,
  );

  for (const user of usersWithoutMemberId) {
    const email = user.email;

    // Skip if email is duplicated in Members (ambiguous match)
    if (duplicatedEmailSet.has(email)) {
      report.skipped.push({
        email,
        userDocNum: user.documentNumber || null,
        memberName: '(duplicated email)',
        memberDocNum: '-',
        result: 'duplicated_email',
      });

      console.log(`  ⏭ SKIPPED ${email} — duplicated email in Members`);

      continue;
    }

    // Find unique Member with that email
    const member = await db
      .collection('members')
      .findOne(
        { email },
        { projection: { fullName: 1, documentType: 1, documentNumber: 1 } },
      );

    if (!member || !member.documentNumber) {
      report.skipped.push({
        email,
        userDocNum: user.documentNumber || null,
        memberName: '(no member)',
        memberDocNum: '-',
        result: 'no_member',
      });

      continue;
    }

    // Link
    const docType = member.documentType || 'CC';

    if (!DRY_RUN) {
      await db.collection('users').updateOne(
        { _id: user._id },
        {
          $set: {
            memberId: member._id,
            documentType: docType,
            documentNumber: member.documentNumber,
          },
        },
      );
    }

    report.linked.push({
      email,
      userDocNum: user.documentNumber || null,
      memberName: member.fullName,
      memberDocNum: member.documentNumber,
      result: 'linked',
    });

    console.log(
      `  ✓ ${email} → ${member.fullName} (${docType}: ${member.documentNumber})`,
    );
  }

  console.log();

  // =========================================
  // FINAL REPORT
  // =========================================

  const totalUsers = await db.collection('users').countDocuments();

  const usersWithMid = await db
    .collection('users')
    .countDocuments({ memberId: { $exists: true, $ne: null } });
  const usersWithoutMid = totalUsers - usersWithMid;

  const usersWithoutDoc = await db.collection('users').countDocuments({
    $or: [
      { documentNumber: { $exists: false } },
      { documentNumber: null },
      { documentNumber: '' },
    ],
  });

  console.log('========================================');
  console.log('FINAL REPORT');
  console.log('========================================');
  console.log(`  Members documentType → CC:  ${report.membersDocTypeFixed}`);
  console.log(`  Users linked:               ${report.linked.length}`);
  console.log(
    `  Users skipped (dup email):  ${
      report.skipped.filter((o) => o.result === 'duplicated_email').length
    }`,
  );
  console.log(
    `  Users skipped (no member):  ${
      report.skipped.filter((o) => o.result === 'no_member').length
    }`,
  );
  console.log(`  Total users:                ${totalUsers}`);
  console.log(`  Users with memberId:        ${usersWithMid}`);
  console.log(`  Users without memberId:     ${usersWithoutMid}`);
  console.log(`  Users without documentNum:  ${usersWithoutDoc}`);
  console.log(
    `  Mode:                       ${DRY_RUN ? 'DRY RUN' : 'EXECUTED'}`,
  );

  await client.close();
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
