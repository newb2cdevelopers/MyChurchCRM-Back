import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  SundaySchoolClass,
  SundaySchoolClassDocument,
} from 'src/schemas/sundaySchool/class.schema';
import {
  CreateClassDto,
  UpdateClassDto,
} from 'src/schemas/sundaySchool/class.DTO';
import { PaginatedResult, calculatePagination } from 'src/dtos/pagination.dto';

export type ClassCreatePayload = Omit<CreateClassDto, 'levelIds' | 'date'> & {
  levelIds: string[];
  date: Date;
  pdfUrl: string;
  churchId: string;
};

export type ClassUpdatePayload = Omit<UpdateClassDto, 'levelIds' | 'date'> & {
  levelIds?: string[];
  date?: Date;
  pdfUrl?: string;
};

@Injectable()
export class SundaySchoolClassProvider {
  constructor(
    @InjectModel(SundaySchoolClass.name)
    private readonly classModel: Model<SundaySchoolClassDocument>,
  ) {}

  async create(data: ClassCreatePayload): Promise<SundaySchoolClassDocument> {
    return this.classModel.create(data);
  }

  async getAllByChurch(
    churchId: string,
    levelIds?: string[],
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<SundaySchoolClass>> {
    const {
      skip,
      page: currentPage,
      limit: pageSize,
    } = calculatePagination({
      page,
      limit,
    });

    const filter: Record<string, unknown> = { churchId };

    if (levelIds?.length) {
      filter.levelIds = { $in: levelIds };
    }

    const [data, totalRecords] = await Promise.all([
      this.classModel
        .find(filter)
        .populate({
          path: 'levelIds',
          model: 'Level',
          select: 'name minAge maxAge',
        })
        .sort({ date: -1 })
        .skip(skip)
        .limit(pageSize),
      this.classModel.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalRecords / pageSize);

    return { data, metadata: { currentPage, totalPages, totalRecords } };
  }

  async getById(id: string): Promise<SundaySchoolClassDocument | null> {
    return this.classModel.findById(id).populate({
      path: 'levelIds',
      model: 'Level',
      select: 'name minAge maxAge',
    });
  }

  /**
   * Returns the most recent class of the church whose date falls within the
   * given week window, optionally filtered by level.
   */
  async findForWeek(
    churchId: string,
    startOfWeek: Date,
    endOfWeek: Date,
    levelId?: string,
  ): Promise<SundaySchoolClassDocument | null> {
    const filter: Record<string, unknown> = {
      churchId,
      date: { $gte: startOfWeek, $lte: endOfWeek },
    };

    if (levelId) {
      filter.levelIds = levelId;
    }

    return this.classModel.findOne(filter).sort({ date: -1 }).populate({
      path: 'levelIds',
      model: 'Level',
      select: 'name minAge maxAge',
    });
  }

  /**
   * Returns a class of the church that shares the same date and at least one
   * level with the given level list. Used to prevent duplicate classes.
   */
  async findByDateAndLevels(
    churchId: string,
    date: Date,
    levelIds: string[],
  ): Promise<SundaySchoolClassDocument | null> {
    return this.classModel.findOne({
      churchId,
      date,
      levelIds: { $in: levelIds },
    });
  }

  async update(
    id: string,
    data: ClassUpdatePayload,
  ): Promise<SundaySchoolClassDocument | null> {
    return this.classModel
      .findByIdAndUpdate(id, { $set: data }, { new: true })
      .populate({
        path: 'levelIds',
        model: 'Level',
        select: 'name minAge maxAge',
      });
  }

  async delete(id: string): Promise<void> {
    await this.classModel.deleteOne({ _id: id });
  }
}
