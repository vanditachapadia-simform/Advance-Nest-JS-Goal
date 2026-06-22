import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Role, UserStatus } from '../../../shared/enums';

export type UserDocument = HydratedDocument<User>;

/**
 * User collection.
 *
 * `password` uses `select: false` so it is excluded from queries by default —
 * callers must explicitly `.select('+password')` (done only during auth). This
 * is a defence-in-depth measure against accidentally leaking hashes.
 */
@Schema({
  timestamps: true,
  collection: 'users',
  toJSON: {
    virtuals: true,
    transform: (_doc, ret: Record<string, any>) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      delete ret.password;
      delete ret.refreshTokenHash;
      return ret;
    },
  },
})
export class User {
  @Prop({ required: true, trim: true })
  firstName!: string;

  @Prop({ required: true, trim: true })
  lastName!: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true, index: true })
  email!: string;

  @Prop({ required: true, select: false })
  password!: string;

  @Prop({ type: [String], enum: Role, default: [Role.USER] })
  roles!: Role[];

  @Prop({ enum: UserStatus, default: UserStatus.ACTIVE, index: true })
  status!: UserStatus;

  /** Hash of the currently-valid refresh token (rotation support). */
  @Prop({ type: String, select: false, default: null })
  refreshTokenHash?: string | null;

  @Prop({ type: Date, default: null })
  lastLoginAt?: Date | null;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Compound index supporting the common "active users by role" admin query.
UserSchema.index({ status: 1, roles: 1 });

// Virtual full name — demonstrates Mongoose virtuals in serialization.
UserSchema.virtual('fullName').get(function (this: User) {
  return `${this.firstName} ${this.lastName}`;
});
