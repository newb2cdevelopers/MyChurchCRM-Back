import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { Level, LevelDocument } from 'src/schemas/level/level.schema';
import { CreateLevelDto, UpdateLevelDto } from 'src/schemas/level/level.DTO';
import { Students, StudentDocument } from 'src/schemas/student/student.schema';
import { Users, UserDocument } from 'src/schemas/user/user.schema';
import { Members, MemberDocument } from 'src/schemas/member/member.shema';
import { TtlCache } from 'src/utilities/ttl-cache';
import { withLegacyMemberFields } from 'src/utils/legacy-identity.util';

export interface UserScopeInfo {
  roleNames: string[];
  personId?: string;
  teacherMemberId?: string;
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
    @InjectModel(Members.name)
    private readonly memberModel: Model<MemberDocument>,
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
      .select('personId roles churchId')
      .lean();

    if (!user) {
      const emptyResult = { roleNames: [] };
      this.userScopeCache.set(cacheKey, emptyResult);
      return emptyResult;
    }

    const roles = user.roles as unknown as { name: string }[];
    const personId = (user as { personId?: unknown }).personId?.toString();

    let teacherMemberId: string | undefined;

    if (personId && user.churchId) {
      const member = await this.memberModel
        .findOne({ personId, churchId: user.churchId, status: 'active' })
        .select('_id')
        .lean();

      if (member) {
        teacherMemberId = member._id.toString();
      }
    }

    const result = {
      roleNames: roles?.map((r) => r.name) || [],
      personId,
      teacherMemberId,
    };

    this.userScopeCache.set(cacheKey, result);
    return result;
  }

  async getLevelIdsByTeacher(teacherMemberId: string): Promise<string[]> {
    const cacheKey = `teacher-levels:${teacherMemberId}`;
    const cached = this.teacherLevelsCache.get(cacheKey);

    if (cached) {
      return cached;
    }

    const levels = await this.levelModel
      .find({ teachers: teacherMemberId })
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

    const levels = await this.levelModel
      .find(filter)
      .populate({
        path: 'teachers',
        populate: { path: 'personId', model: 'Person' },
      })
      .sort({ minAge: 1 })
      .lean();

    return levels.map((level) =>
      this.withLegacyTeachers(level),
    ) as unknown as LevelDocument[];
  }

  async getById(id: string): Promise<LevelDocument | null> {
    const level = await this.levelModel
      .findById(id)
      .populate({
        path: 'teachers',
        populate: { path: 'personId', model: 'Person' },
      })
      .lean();

    if (!level) return null;

    return this.withLegacyTeachers(level) as unknown as LevelDocument;
  }

  async getLevelIdsByChurch(churchId: string): Promise<string[]> {
    const levels = await this.levelModel
      .find({ churchId })
      .select('_id')
      .lean();

    return levels.map((level) => level._id.toString());
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
    const updated = await this.levelModel
      .findByIdAndUpdate(id, { $set: level }, { new: true })
      .populate({
        path: 'teachers',
        populate: { path: 'personId', model: 'Person' },
      })
      .lean();

    if (!updated) return null;

    return this.withLegacyTeachers(updated) as unknown as LevelDocument;
  }

  private withLegacyTeachers<T extends { teachers?: unknown }>(level: T): T {
    const teachers = level.teachers;

    if (!Array.isArray(teachers)) return level;

    return {
      ...level,
      teachers: teachers.map((teacher) =>
        teacher && typeof teacher === 'object'
          ? withLegacyMemberFields(teacher as { personId?: unknown })
          : teacher,
      ),
    };
  }

  async delete(id: string): Promise<void> {
    await this.levelModel.deleteOne({ _id: id });
  }

  async countStudentsByLevel(levelId: string): Promise<number> {
    return this.studentModel.countDocuments({ levelId });
  }
}
