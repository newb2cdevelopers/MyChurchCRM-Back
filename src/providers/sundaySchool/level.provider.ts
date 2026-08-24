import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { Level, LevelDocument } from 'src/schemas/level/level.schema';
import { CreateLevelDto, UpdateLevelDto } from 'src/schemas/level/level.DTO';
import { Students, StudentDocument } from 'src/schemas/student/student.schema';
import { Users, UserDocument } from 'src/schemas/user/user.schema';
import { TtlCache } from 'src/utilities/ttl-cache';

export interface UserScopeInfo {
  roleNames: string[];
  memberId?: string;
}

@Injectable()
export class LevelProvider {
  private readonly logger = new Logger(LevelProvider.name);
  private readonly userScopeCache = new TtlCache<UserScopeInfo>(60_000);
  private readonly teacherLevelsCache = new TtlCache<string[]>(60_000);

  constructor(
    @InjectModel(Level.name)
    private readonly levelModel: Model<LevelDocument>,
    @InjectModel(Students.name)
    private readonly studentModel: Model<StudentDocument>,
    @InjectModel(Users.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async create(
    level: CreateLevelDto & { churchId: string },
  ): Promise<LevelDocument> {
    return this.levelModel.create(level);
  }

  async getUserScopeInfo(userId: string): Promise<UserScopeInfo> {
    const cacheKey = `user-scope:${userId}`;
    const cached = this.userScopeCache.get(cacheKey);

    if (cached) {
      return cached;
    }

    const user = await this.userModel
      .findById(userId)
      .populate({ path: 'roles', model: 'Role', select: 'name' })
      .select('memberId roles')
      .lean();

    if (!user) {
      const emptyResult = { roleNames: [] };
      this.userScopeCache.set(cacheKey, emptyResult);
      return emptyResult;
    }

    const roles = user.roles as unknown as { name: string }[];

    const result = {
      roleNames: roles?.map((r) => r.name) || [],
      memberId: user.memberId?.toString(),
    };

    this.userScopeCache.set(cacheKey, result);
    return result;
  }

  async getLevelIdsByTeacher(memberId: string): Promise<string[]> {
    const cacheKey = `teacher-levels:${memberId}`;
    const cached = this.teacherLevelsCache.get(cacheKey);

    if (cached) {
      return cached;
    }

    const levels = await this.levelModel
      .find({ teachers: memberId })
      .select('_id')
      .lean();

    const result = levels.map((level) => level._id.toString());
    this.teacherLevelsCache.set(cacheKey, result);
    return result;
  }

  async getAllByChurch(
    churchId: string,
    search?: string,
    scopeFilter?: FilterQuery<LevelDocument>,
  ): Promise<LevelDocument[]> {
    const filter: FilterQuery<LevelDocument> = { churchId };

    if (scopeFilter) {
      Object.assign(filter, scopeFilter);
    }

    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    return this.levelModel
      .find(filter)
      .populate('teachers')
      .sort({ minAge: 1 })
      .lean();
  }

  async getById(id: string): Promise<LevelDocument | null> {
    return this.levelModel.findById(id).populate('teachers').lean();
  }

  async getLevelsByIdsAndChurch(
    levelIds: string[],
    churchId: string,
  ): Promise<LevelDocument[]> {
    return this.levelModel
      .find({
        _id: { $in: levelIds },
        churchId,
      })
      .lean();
  }

  /**
   * Returns levels whose teachers array contains any of the given teacher
   * IDs. Optionally excludes a level (e.g. the level being edited) so a
   * teacher assigned only to that level is not reported as a conflict.
   */
  async getLevelsByTeachers(
    teacherIds: string[],
    excludeLevelId?: string,
  ): Promise<LevelDocument[]> {
    const filter: FilterQuery<LevelDocument> = {
      teachers: { $in: teacherIds },
    };

    if (excludeLevelId) {
      filter._id = { $ne: excludeLevelId };
    }

    return this.levelModel.find(filter).select('name teachers').lean();
  }

  async findByNameAndChurch(
    name: string,
    churchId: string,
  ): Promise<LevelDocument | null> {
    return this.levelModel.findOne({ name, churchId }).lean();
  }

  async update(
    id: string,
    level: UpdateLevelDto,
  ): Promise<LevelDocument | null> {
    return this.levelModel
      .findByIdAndUpdate(id, { $set: level }, { new: true })
      .populate('teachers')
      .lean();
  }

  async delete(id: string): Promise<void> {
    await this.levelModel.deleteOne({ _id: id });
  }

  async countStudentsByLevel(levelId: string): Promise<number> {
    return this.studentModel.countDocuments({ levelId });
  }
}
