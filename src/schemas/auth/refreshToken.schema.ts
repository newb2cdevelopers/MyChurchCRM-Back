import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

/**
 * RefreshToken Schema
 *
 * Stores refresh tokens for user authentication sessions.
 * Allows multiple active sessions per user (different devices/browsers).
 *
 * @remarks
 * - Each user can have multiple refresh tokens (one per device/session)
 * - Tokens expire after 7 days
 * - Tokens can be revoked individually for security
 * - Includes metadata for auditing (IP, user agent, creation date)
 */
@Schema({ timestamps: true })
export class RefreshToken {
  _id: number;

  @Prop({ required: true, unique: true })
  token: string;

  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
  })
  userId: string;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ default: false })
  isRevoked: boolean;

  @Prop()
  ipAddress: string;

  @Prop()
  userAgent: string;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export type RefreshTokenDocument = RefreshToken & mongoose.Document;

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);

// Index for token lookup
RefreshTokenSchema.index({ token: 1 }, { unique: true });

// Index for automatic cleanup of expired tokens (TTL)
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound index for efficient queries by user
RefreshTokenSchema.index({ userId: 1, isRevoked: 1 });
