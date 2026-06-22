import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { UsersRepository } from './users.repository';
import { User, UserSchema } from './schemas/user.schema';
import { Role, UserStatus } from '../../shared/enums';

/**
 * Integration test against a real (in-memory) MongoDB instance — exercises the
 * actual Mongoose layer, indexes and the `select: false` password behaviour.
 *
 * Requires the mongodb-memory-server binary (downloaded on first run). If your
 * environment is offline, run once with network access to cache the binary.
 */
describe('UsersRepository (integration)', () => {
  let mongod: MongoMemoryServer;
  let repository: UsersRepository;
  let moduleRef: TestingModule;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    moduleRef = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(mongod.getUri()),
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
      ],
      providers: [UsersRepository],
    }).compile();

    repository = moduleRef.get(UsersRepository);
  }, 60_000);

  afterAll(async () => {
    await moduleRef?.close();
    await mongod?.stop();
  });

  it('persists and retrieves a user', async () => {
    const created = await repository.create({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      password: 'hashed',
      roles: [Role.USER],
      status: UserStatus.ACTIVE,
    });
    expect((created as any).id).toBeDefined();

    const found = await repository.findByEmailWithPassword('jane@example.com');
    expect(found?.email).toBe('jane@example.com');
    // password is select:false by default but explicitly selected here
    expect(found?.password).toBe('hashed');
  });

  it('hides the password by default', async () => {
    const found = await repository.findOne({ email: 'jane@example.com' });
    expect((found as any)?.password).toBeUndefined();
  });

  it('enforces the unique email index', async () => {
    await expect(
      repository.create({
        firstName: 'Dup',
        lastName: 'User',
        email: 'jane@example.com',
        password: 'x',
      }),
    ).rejects.toBeDefined();
  });
});
