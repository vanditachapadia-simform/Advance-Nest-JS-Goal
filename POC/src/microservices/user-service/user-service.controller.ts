import { Controller, Logger } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../../modules/users/schemas/user.schema';
import { PATTERNS } from '../../shared/constants';

/**
 * User microservice handlers.
 *
 *  - `@MessagePattern` = request/response (RPC-style) — gateway awaits a reply.
 *  - `@EventPattern`   = fire-and-forget — no response expected.
 */
@Controller()
export class UserServiceController {
  private readonly logger = new Logger(UserServiceController.name);

  constructor(@InjectModel(User.name) private readonly userModel: Model<User>) {}

  @MessagePattern(PATTERNS.USER_FIND_BY_ID)
  async findById(@Payload() data: { id: string }) {
    const user = await this.userModel.findById(data.id).exec();
    return user ? { id: data.id, email: user.email, roles: user.roles } : null;
  }

  @MessagePattern(PATTERNS.USER_VALIDATE)
  async validate(@Payload() data: { id: string }) {
    const exists = await this.userModel.exists({ _id: data.id });
    return { valid: Boolean(exists) };
  }

  @EventPattern(PATTERNS.EVENT_USER_CREATED)
  handleUserCreated(@Payload() data: { userId: string; email: string }) {
    this.logger.log(`[user-service] received user.created event for ${data.email}`);
  }
}
