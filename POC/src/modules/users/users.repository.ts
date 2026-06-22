import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../database/base.repository';
import { User, UserDocument } from './schemas/user.schema';

/**
 * User data-access. Extends the generic `BaseRepository` and adds queries that
 * need the normally-hidden `password` / `refreshTokenHash` fields (used only
 * by the auth flow).
 */
@Injectable()
export class UsersRepository extends BaseRepository<User> {
  constructor(@InjectModel(User.name) private readonly userModel: Model<User>) {
    super(userModel);
  }

  /** Includes the password hash — for credential verification only. */
  findByEmailWithPassword(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).select('+password').exec();
  }

  /** Includes the refresh-token hash — for refresh-token rotation. */
  findByIdWithRefreshToken(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).select('+refreshTokenHash').exec();
  }
}
