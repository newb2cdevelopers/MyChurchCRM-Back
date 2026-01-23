import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  RefreshToken,
  RefreshTokenDocument,
} from 'src/schemas/auth/refreshToken.schema';

/**
 * RefreshToken Provider
 *
 * Repository layer for refresh token database operations.
 * Contains only CRUD operations, no business logic.
 */
@Injectable()
export class RefreshTokenProvider {
  constructor(
    @InjectModel(RefreshToken.name)
    private refreshTokenModel: Model<RefreshTokenDocument>,
  ) {}

  async createRefreshToken(refreshTokenData: {
    token: string;
    userId: string;
    expiresAt: Date;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return this.refreshTokenModel.create(refreshTokenData);
  }

  async findByToken(token: string) {
    return this.refreshTokenModel.findOne({ token }).populate('userId');
  }

  async revokeToken(token: string) {
    return this.refreshTokenModel.updateOne({ token }, { isRevoked: true });
  }

  async revokeAllUserTokens(userId: string) {
    return this.refreshTokenModel.updateMany(
      { userId, isRevoked: false },
      { isRevoked: true },
    );
  }

  async getUserActiveTokens(userId: string) {
    return this.refreshTokenModel.find({
      userId,
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    });
  }

  async deleteExpiredTokens() {
    return this.refreshTokenModel.deleteMany({
      expiresAt: { $lt: new Date() },
    });
  }
}
