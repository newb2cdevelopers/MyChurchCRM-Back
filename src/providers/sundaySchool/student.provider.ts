import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { Students, StudentDocument } from 'src/schemas/student/student.schema';
import {
  CreateStudentDto,
  UpdateStudentDto,
} from 'src/schemas/student/student.DTO';
import { PaginatedResult, calculatePagination } from 'src/dtos/pagination.dto';

@Injectable()
export class StudentProvider {
  constructor(
    @InjectModel(Students.name)
    private readonly studentModel: Model<StudentDocument>,
  ) {}

  async create(
    student: CreateStudentDto & { churchId: string },
  ): Promise<StudentDocument> {
    return this.studentModel.create(student);
  }

  async getAll(
    churchId: string,
    levelIds?: string[],
    search?: string,
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<Students>> {
    const { skip } = calculatePagination({ page, limit });

    const filter: FilterQuery<StudentDocument> = { churchId };

    if (levelIds?.length) {
      filter.levelId = { $in: levelIds };
    }

    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [
        { name: regex },
        { lastName: regex },
        { documentNumber: regex },
      ];
    }

    const [data, totalRecords] = await Promise.all([
      this.studentModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit || 10)
        .populate('levelId')
        .lean(),
      this.studentModel.countDocuments(filter),
    ]);

    const { page: currentPage, limit: pageSize } = calculatePagination({
      page,
      limit,
    });
    const totalPages = Math.ceil(totalRecords / pageSize);

    return { data, metadata: { currentPage, totalPages, totalRecords } };
  }

  async getById(id: string): Promise<StudentDocument | null> {
    return this.studentModel.findById(id).populate('levelId').lean();
  }

  async findByDocument(
    documentNumber: string,
    churchId: string,
    excludeId?: string,
  ): Promise<StudentDocument | null> {
    const filter: FilterQuery<StudentDocument> = { documentNumber, churchId };

    if (excludeId) {
      filter._id = { $ne: excludeId };
    }

    return this.studentModel.findOne(filter).lean();
  }

  async update(
    id: string,
    student: UpdateStudentDto,
  ): Promise<StudentDocument | null> {
    return this.studentModel
      .findByIdAndUpdate(id, { $set: student }, { new: true })
      .populate('levelId')
      .lean();
  }

  async delete(id: string): Promise<void> {
    await this.studentModel.deleteOne({ _id: id });
  }

  async getByLevel(levelId: string): Promise<StudentDocument[]> {
    return this.studentModel.find({ levelId }).select('_id').lean();
  }
}
