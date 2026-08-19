import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { Level, LevelDocument } from 'src/schemas/level/level.schema';
import { CreateLevelDto, UpdateLevelDto } from 'src/schemas/level/level.DTO';
import { Students, StudentDocument } from 'src/schemas/student/student.schema';
import { Users, UserDocument } from 'src/schemas/user/user.schema';

export interface UserScopeInfo {
  roleNames: string[];
  memberId?: string;
}

@Injectable()
export class LevelProvider {
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
    const user = await this.userModel
      .findById(userId)
      .populate({ path: 'roles', model: 'Role', select: 'name' })
      .select('memberId roles');

    if (!user) return { roleNames: [] };

    const roles = user.roles as unknown as { name: string }[];

    return {
      roleNames: roles?.map((r) => r.name) || [],
      memberId: user.memberId?.toString(),
    };
  }

  async getLevelIdsByTeacher(memberId: string): Promise<string[]> {
    const levels = await this.levelModel
      .find({ teachers: memberId })
      .select('_id');

    return levels.map((level) => level._id.toString());
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
      .sort({ minAge: 1 });
  }

  async getById(id: string): Promise<LevelDocument | null> {
    return this.levelModel.findById(id).populate('teachers');
  }

  async getLevelsByIdsAndChurch(
    levelIds: string[],
    churchId: string,
  ): Promise<LevelDocument[]> {
    return this.levelModel.find({
      _id: { $in: levelIds },
      churchId,
    });
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

    return this.levelModel.find(filter).select('name teachers');
  }

  async findByNameAndChurch(
    name: string,
    churchId: string,
  ): Promise<LevelDocument | null> {
    return this.levelModel.findOne({ name, churchId });
  }

  async update(
    id: string,
    level: UpdateLevelDto,
  ): Promise<LevelDocument | null> {
    return this.levelModel
      .findByIdAndUpdate(id, { $set: level }, { new: true })
      .populate('teachers');
  }

  async delete(id: string): Promise<void> {
    await this.levelModel.deleteOne({ _id: id });
  }

  async countStudentsByLevel(levelId: string): Promise<number> {
    return this.studentModel.countDocuments({ levelId });
  }
}
