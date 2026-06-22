import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppConfigModule } from '../../config/app-config.module';
import { DatabaseModule } from '../../database/database.module';
import { User, UserSchema } from '../../modules/users/schemas/user.schema';
import { UserServiceController } from './user-service.controller';

/** Standalone module for the user TCP microservice. */
@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [UserServiceController],
})
export class UserServiceModule {}
