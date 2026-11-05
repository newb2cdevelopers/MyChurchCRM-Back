import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { Students, StudentDocument } from 'src/schemas/student/student.schema';
import {
  CreateStudentDto,
  UpdateStudentDto,
} from 'src/schemas/student/student.DTO';
import { PaginatedResult, calculatePagination } from 'src/dtos/pagination.dto';
import { PersonProvider } from 'src/providers/person/person.provider';
import { withLegacyStudentFields } from 'src/utils/legacy-identity.util';

@Injectable()
export class StudentProvider {
  constructor(
    @InjectModel(Students.name)
    private readonly studentModel: Model<StudentDocument>,
    private readonly personProvider: PersonProvider,
  ) {}

  async create(
    student: CreateStudentDto & {
      churchId: string;
      personId?: Types.ObjectId;
    },
  ): Promise<StudentDocument> {
    // Identity fields live in Person; only student-specific data is persisted.
    return this.studentModel.create({
      personId: student.personId,
      fatherName: student.fatherName,
      motherName: student.motherName,
      emergencyContactName: student.emergencyContactName,
      emergencyContactPhone: student.emergencyContactPhone,
      guardianName: student.guardianName,
      observations: student.observations,
      levelId: student.levelId,
      churchId: student.churchId,
    });
  }

  async findByPersonId(
    personId: string,
    churchId: string,
    excludeId?: string,
  ): Promise<StudentDocument | null> {
    const filter: FilterQuery<StudentDocument> = { personId, churchId };

    if (excludeId) {
      filter._id = { $ne: excludeId };
    }

    return this.studentModel.findOne(filter).lean();
  }

  async getAll(
    churchId: string,
    levelIds?: string[],
    search?: string,
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<Students>> {
    const { skip } = calculatePagination({ page, limit });

    const filter: FilterQuery<StudentDocument> = {
      churchId,
      graduated: { $ne: true },
    };

    if (levelIds?.length) {
      filter.levelId = { $in: levelIds };
    }

    if (search) {
      const personIds = await this.personProvider.findIdsBySearch(search);
      filter.$or = [{ personId: { $in: personIds } }];
    }

    const [data, totalRecords] = await Promise.all([
      this.studentModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit || 10)
        .populate('levelId')
        .populate({ path: 'personId', model: 'Person' })
        .lean(),
      this.studentModel.countDocuments(filter),
    ]);

    const { page: currentPage, limit: pageSize } = calculatePagination({
      page,
      limit,
    });
    const totalPages = Math.ceil(totalRecords / pageSize);

    return {
      data: data.map((student) =>
        withLegacyStudentFields(student),
      ) as unknown as Students[],
      metadata: { currentPage, totalPages, totalRecords },
    };
  }

  async getById(id: string): Promise<StudentDocument | null> {
    const student = await this.studentModel
      .findById(id)
      .populate('levelId')
      .populate({ path: 'personId', model: 'Person' })
      .lean();

    if (!student) return null;

    return withLegacyStudentFields(student) as unknown as StudentDocument;
  }

  async update(
    id: string,
    student: UpdateStudentDto,
    personId?: string,
  ): Promise<StudentDocument | null> {
    // Identity fields live in `persons`; only student-owned fields are persisted here.
    const studentData = Object.fromEntries(
      Object.entries({
        fatherName: student.fatherName,
        motherName: student.motherName,
        emergencyContactName: student.emergencyContactName,
        emergencyContactPhone: student.emergencyContactPhone,
        guardianName: student.guardianName,
        observations: student.observations,
        levelId: student.levelId,
      }).filter(([, value]) => value !== undefined),
    );

    const update = personId ? { ...studentData, personId } : studentData;

    const updated = await this.studentModel
      .findByIdAndUpdate(id, { $set: update }, { new: true })
      .populate('levelId')
      .populate({ path: 'personId', model: 'Person' })
      .lean();

    if (!updated) return null;

    return withLegacyStudentFields(updated) as unknown as StudentDocument;
  }

  async delete(id: string): Promise<void> {
    await this.studentModel.deleteOne({ _id: id });
  }

  async getByLevel(levelId: string): Promise<StudentDocument[]> {
    return this.studentModel
      .find({ levelId, graduated: { $ne: true } })
      .select('_id')
      .lean();
  }

  async getForPromotion(levelId: string): Promise<StudentDocument[]> {
    const students = await this.studentModel
      .find({ levelId, graduated: { $ne: true } })
      .populate({ path: 'personId', model: 'Person' })
      .lean();

    return students
      .map((student) => withLegacyStudentFields(student))
      .sort((a, b) =>
        (a.name || '').localeCompare(b.name || ''),
      ) as unknown as StudentDocument[];
  }

  async getManyByIds(ids: string[]): Promise<StudentDocument[]> {
    return this.studentModel
      .find({ _id: { $in: ids } })
      .select('_id levelId churchId graduated')
      .lean();
  }

  async promoteMany(
    studentIds: string[],
    update: Partial<StudentDocument>,
  ): Promise<void> {
    await this.studentModel.updateMany(
      { _id: { $in: studentIds } },
      { $set: update },
    );
  }
}
