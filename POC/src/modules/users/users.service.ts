import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as bcrypt from 'bcrypt';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
import { ResourceNotFoundException } from '../../common/exceptions/business.exception';
import { EVENTS } from '../../shared/constants';
import { UserCreatedEvent } from '../../events/event-payloads';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private readonly SALT_ROUNDS = 12;

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const password = await bcrypt.hash(dto.password, this.SALT_ROUNDS);
    const user = (await this.usersRepository.create({ ...dto, password })) as UserDocument;
    this.logger.log(`User created: ${user.email}`);

    // Emit a domain event — listeners send the welcome email asynchronously.
    this.eventEmitter.emit(
      EVENTS.USER_CREATED,
      new UserCreatedEvent(user.id, user.email, user.firstName),
    );
    return user;
  }

  async findAll(pagination: PaginationDto): Promise<PaginatedResult<User>> {
    const sort = this.buildSort(pagination.sort);
    const { items, total } = await this.usersRepository.paginate(
      {},
      { skip: pagination.skip, limit: pagination.limit, sort },
    );
    return PaginatedResult.build(items, total, pagination.page, pagination.limit);
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findById(id);
    if (!user) throw new ResourceNotFoundException('User', id);
    return user;
  }

  /** Used by the auth flow — returns the hash-bearing document or null. */
  findByEmailWithPassword(email: string) {
    return this.usersRepository.findByEmailWithPassword(email.toLowerCase());
  }

  findByIdWithRefreshToken(id: string) {
    return this.usersRepository.findByIdWithRefreshToken(id);
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.usersRepository.update(id, dto);
    if (!user) throw new ResourceNotFoundException('User', id);
    return user;
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.usersRepository.delete(id);
    if (!deleted) throw new ResourceNotFoundException('User', id);
  }

  /** Persists a hashed refresh token (rotation). Pass null on logout. */
  async setRefreshTokenHash(id: string, token: string | null): Promise<void> {
    const refreshTokenHash = token ? await bcrypt.hash(token, this.SALT_ROUNDS) : null;
    await this.usersRepository.update(id, { refreshTokenHash });
  }

  async recordLogin(id: string): Promise<void> {
    await this.usersRepository.update(id, { lastLoginAt: new Date() });
  }

  private buildSort(sort?: string): Record<string, 1 | -1> {
    if (!sort) return { createdAt: -1 };
    return sort.startsWith('-') ? { [sort.slice(1)]: -1 } : { [sort]: 1 };
  }
}
