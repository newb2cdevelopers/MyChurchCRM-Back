import { config } from 'dotenv';
import { MongoClient, ObjectId } from 'mongodb';
import { writeFile } from 'fs/promises';

config();

interface StudentRecord {
  _id: ObjectId;
  levelId?: ObjectId;
  churchId?: ObjectId;
  graduated?: boolean;
  graduatedAt?: Date;
  createdAt?: Date;
}

interface EnrollmentRecord {
  studentId: ObjectId;
  levelId: ObjectId;
  churchId: ObjectId;
  startDate: Date;
  endDate?: Date | null;
  status: 'active' | 'graduated';
}

interface BackfillReport {
  mode: 'dry-run' | 'write';
  generatedAt: string;
  studentsScanned: number;
  studentsWithoutLevel: number;
  studentsWithoutChurch: number;
  enrollmentsToCreate: number;
  enrollmentsCreated: number;
  skippedExisting: number;
  errors: string[];
}

const mongoUri = process.env.DEV_DB_CONNECTION;
const isWriteMode = process.argv.includes('--write');
const reportArgumentIndex = process.argv.indexOf('--report');
const reportPath =
  reportArgumentIndex >= 0 ? process.argv[reportArgumentIndex + 1] : undefined;

function buildEnrollment(student: StudentRecord): EnrollmentRecord {
  const graduated = student.graduated === true;

  return {
    studentId: student._id,
    levelId: student.levelId as ObjectId,
    churchId: student.churchId as ObjectId,
    startDate: student.createdAt || new Date(),
    endDate: graduated ? student.graduatedAt || new Date() : null,
    status: graduated ? 'graduated' : 'active',
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
    const students = db.collection<StudentRecord>('students');
    const enrollments = db.collection<EnrollmentRecord>('levelEnrollments');

    const report: BackfillReport = {
      mode: isWriteMode ? 'write' : 'dry-run',
      generatedAt: new Date().toISOString(),
      studentsScanned: 0,
      studentsWithoutLevel: 0,
      studentsWithoutChurch: 0,
      enrollmentsToCreate: 0,
      enrollmentsCreated: 0,
      skippedExisting: 0,
      errors: [],
    };

    const cursor = students.find({});

    for await (const student of cursor) {
      report.studentsScanned += 1;

      if (!student.levelId) {
        report.studentsWithoutLevel += 1;
        continue;
      }

      if (!student.churchId) {
        report.studentsWithoutChurch += 1;
        report.errors.push(
          `Student ${student._id.toString()} has levelId but no churchId`,
        );
        continue;
      }

      const existing = await enrollments.findOne({
        studentId: student._id,
        levelId: student.levelId,
        status: student.graduated ? 'graduated' : 'active',
      });

      if (existing) {
        report.skippedExisting += 1;
        continue;
      }

      report.enrollmentsToCreate += 1;

      if (isWriteMode) {
        try {
          await enrollments.insertOne(buildEnrollment(student));
          report.enrollmentsCreated += 1;
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          report.errors.push(
            `Student ${student._id.toString()}: ${err.message}`,
          );
        }
      }
    }

    if (isWriteMode) {
      await enrollments.createIndex(
        { studentId: 1 },
        {
          unique: true,
          partialFilterExpression: { status: 'active' },
          name: 'level_enrollments_one_active_student',
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
  console.error(`[backfill-level-enrollments] ${error.message}`);
  process.exitCode = 1;
});
