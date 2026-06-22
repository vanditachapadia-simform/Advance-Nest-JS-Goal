# Coding Standards and Best Practices

This document outlines the coding standards, best practices, and architectural patterns used in the Employee Management System. Follow these guidelines to maintain code quality, consistency, and scalability.

---

## Table of Contents

1. [Project Architecture](#project-architecture)
2. [Coding Standards](#coding-standards)
3. [NestJS Best Practices](#nestjs-best-practices)
4. [Database and ORM Guidelines](#database-and-orm-guidelines)
5. [Security Best Practices](#security-best-practices)
6. [API Design Principles](#api-design-principles)
7. [Error Handling](#error-handling)
8. [Testing Guidelines](#testing-guidelines)
9. [Git Workflow](#git-workflow)
10. [Code Review Checklist](#code-review-checklist)

---

## Project Architecture

### Folder Structure

```
src/
├── common/                     # Shared utilities
│   ├── decorators/            # Custom decorators
│   ├── filters/               # Exception filters
│   ├── guards/                # Authentication/Authorization guards
│   ├── interceptors/          # Request/Response interceptors
│   ├── middleware/            # Custom middleware
│   ├── pipes/                 # Validation and transformation pipes
│   └── dto/                   # Shared DTOs
├── config/                    # Configuration modules
│   ├── prisma.module.ts
│   └── prisma.service.ts
├── modules/                   # Feature modules
│   ├── auth/                  # Authentication module
│   ├── user/                  # User management
│   ├── employee/              # Employee management
│   └── department/            # Department management
├── app.module.ts              # Root module
├── app.controller.ts          # Root controller
├── app.service.ts             # Root service
└── main.ts                    # Application entry point
```

### Module Organization

Each feature module should follow this structure:

```
module-name/
├── dto/                       # Data Transfer Objects
│   ├── create-*.dto.ts
│   ├── update-*.dto.ts
│   └── filter-*.dto.ts
├── entities/                  # Database entities (if using TypeORM)
├── module-name.controller.ts  # REST API endpoints
├── module-name.service.ts     # Business logic
├── module-name.module.ts      # Module definition
└── module-name.service.spec.ts # Unit tests
```

---

## Coding Standards

### 1. TypeScript Guidelines

#### Use Strict Typing
```typescript
// ✅ Good
function getUserById(id: string): Promise<User> {
  return this.prisma.user.findUnique({ where: { id } });
}

// ❌ Bad
function getUserById(id: any): Promise<any> {
  return this.prisma.user.findUnique({ where: { id } });
}
```

#### Use Interfaces and Types
```typescript
// ✅ Good
interface CreateUserData {
  email: string;
  password: string;
  role: Role;
}

// ✅ Also good for complex types
type UserWithEmployee = User & {
  employee: Employee;
};
```

#### Avoid `any` Type
```typescript
// ❌ Bad
const data: any = await fetchData();

// ✅ Good
const data: UserResponse = await fetchData();
```

### 2. Naming Conventions

#### Files and Folders
- Use kebab-case: `user-service.ts`, `create-employee.dto.ts`
- Be descriptive: `employee.controller.ts`, not `emp.controller.ts`

#### Classes and Interfaces
- Use PascalCase: `UserService`, `CreateEmployeeDto`
- Interfaces should describe the shape: `IUserRepository`

#### Variables and Functions
- Use camelCase: `userId`, `getUserById()`
- Boolean variables: `isActive`, `hasPermission`, `canDelete`

#### Constants
- Use UPPER_SNAKE_CASE: `MAX_PAGE_SIZE`, `DEFAULT_ROLE`

### 3. Code Organization

#### Import Order
```typescript
// 1. Node.js built-in modules
import { randomUUID } from 'crypto';

// 2. External packages
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@prisma/client';

// 3. Internal modules (absolute imports)
import { CreateUserDto } from './dto/create-user.dto';
import { UserRepository } from './user.repository';

// 4. Relative imports
import { validateEmail } from '../utils/validators';
```

#### Single Responsibility Principle
```typescript
// ✅ Good - Each class has one responsibility
@Injectable()
export class UserService {
  // Only user-related business logic
}

@Injectable()
export class AuthService {
  // Only authentication logic
}

@Injectable()
export class EmailService {
  // Only email-related logic
}
```

---

## NestJS Best Practices

### 1. Dependency Injection

Always use constructor injection:

```typescript
@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}
}
```

### 2. Use DTOs for Validation

```typescript
// ✅ Good - Use class-validator
export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;
}
```

### 3. Custom Decorators

Create reusable decorators for common patterns:

```typescript
// Current user decorator
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

// Usage
@Get('profile')
async getProfile(@CurrentUser() user: User) {
  return user;
}
```

### 4. Guards for Authorization

```typescript
@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class UserController {
  @Get()
  @Roles(Role.ADMIN, Role.MANAGER)
  async findAll() {
    // Only admins and managers can access
  }
}
```

### 5. Interceptors for Cross-Cutting Concerns

```typescript
// Transform response format
@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(data => ({
        statusCode: context.switchToHttp().getResponse().statusCode,
        data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
```

### 6. Exception Filters

```typescript
// Handle Prisma errors globally
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    // Convert Prisma errors to HTTP exceptions
  }
}
```

---

## Database and ORM Guidelines

### 1. Prisma Schema Best Practices

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  employee  Employee?

  // Indexes for performance
  @@index([email])
  @@map("users") // Use snake_case for table names
}
```

### 2. Use Transactions for Multiple Operations

```typescript
async transferEmployee(employeeId: string, newDeptId: string) {
  return this.prisma.$transaction(async (tx) => {
    // Update employee
    const employee = await tx.employee.update({
      where: { id: employeeId },
      data: { departmentId: newDeptId },
    });

    // Log the transfer
    await tx.auditLog.create({
      data: {
        action: 'TRANSFER',
        entityId: employeeId,
        details: { newDepartmentId: newDeptId },
      },
    });

    return employee;
  });
}
```

### 3. Optimize Queries

```typescript
// ✅ Good - Use select to fetch only needed fields
async findUsers() {
  return this.prisma.user.findMany({
    select: {
      id: true,
      email: true,
      employee: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });
}

// ❌ Bad - Fetching all fields
async findUsers() {
  return this.prisma.user.findMany();
}
```

### 4. Implement Soft Deletes

```typescript
// Instead of deleting, mark as inactive
async deactivateUser(id: string) {
  return this.prisma.user.update({
    where: { id },
    data: { isActive: false },
  });
}
```

### 5. Use Migrations

```bash
# Create a migration
npm run prisma:migrate -- --name add_user_table

# Apply migrations in production
npm run prisma:migrate:prod
```

---

## Security Best Practices

### 1. Password Hashing

```typescript
import * as bcrypt from 'bcrypt';

async hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

async comparePasswords(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}
```

### 2. JWT Authentication

```typescript
// Always verify JWT in guards
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}

// Use short expiration for access tokens
{
  secret: process.env.JWT_SECRET,
  signOptions: { expiresIn: '15m' }, // Short-lived
}
```

### 3. Input Validation

```typescript
// Always validate and sanitize inputs
export class CreateUserDto {
  @IsEmail()
  @Transform(({ value }) => value.toLowerCase().trim())
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)/, {
    message: 'Password must contain letters and numbers',
  })
  password: string;
}
```

### 4. Environment Variables

```typescript
// Never commit secrets
// Use .env files and ConfigModule
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: validateConfig, // Validate env vars
    }),
  ],
})
```

### 5. Rate Limiting

```typescript
// Implement rate limiting for APIs
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 10, // 10 requests per minute
    }),
  ],
})
```

---

## API Design Principles

### 1. RESTful Conventions

```
GET    /api/v1/employees          # List all employees
GET    /api/v1/employees/:id      # Get one employee
POST   /api/v1/employees          # Create employee
PATCH  /api/v1/employees/:id      # Update employee
DELETE /api/v1/employees/:id      # Delete employee
```

### 2. Use Proper HTTP Status Codes

```typescript
@Post()
@HttpCode(HttpStatus.CREATED) // 201
async create(@Body() dto: CreateEmployeeDto) {
  return this.service.create(dto);
}

@Get(':id')
@HttpCode(HttpStatus.OK) // 200
async findOne(@Param('id') id: string) {
  return this.service.findOne(id);
}

@Delete(':id')
@HttpCode(HttpStatus.NO_CONTENT) // 204
async remove(@Param('id') id: string) {
  await this.service.remove(id);
}
```

### 3. Consistent Response Format

```typescript
// Success response
{
  statusCode: 200,
  message: "Success",
  data: { ... },
  timestamp: "2024-01-01T00:00:00.000Z"
}

// Error response
{
  statusCode: 404,
  message: "User not found",
  error: "Not Found",
  timestamp: "2024-01-01T00:00:00.000Z"
}
```

### 4. Pagination

```typescript
export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

// Response
{
  data: [...],
  meta: {
    total: 150,
    page: 1,
    limit: 10,
    totalPages: 15,
    hasNextPage: true,
    hasPreviousPage: false
  }
}
```

### 5. API Versioning

```typescript
// Use URL versioning
app.setGlobalPrefix('api/v1');

// Or header versioning
@Controller({
  path: 'users',
  version: '1',
})
```

---

## Error Handling

### 1. Use Built-in HTTP Exceptions

```typescript
import {
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';

// ✅ Good
if (!user) {
  throw new NotFoundException('User not found');
}

if (user.role !== Role.ADMIN) {
  throw new ForbiddenException('Insufficient permissions');
}
```

### 2. Custom Exception Filters

```typescript
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status = exception.getStatus();

    response.status(status).json({
      statusCode: status,
      message: exception.message,
      timestamp: new Date().toISOString(),
    });
  }
}
```

### 3. Logging

```typescript
import { Logger } from '@nestjs/common';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  async create(dto: CreateUserDto) {
    this.logger.log(`Creating user: ${dto.email}`);
    try {
      const user = await this.prisma.user.create({ data: dto });
      this.logger.log(`User created successfully: ${user.id}`);
      return user;
    } catch (error) {
      this.logger.error(`Failed to create user: ${error.message}`);
      throw error;
    }
  }
}
```

---

## Testing Guidelines

### 1. Unit Tests

```typescript
describe('UserService', () => {
  let service: UserService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should create a user', async () => {
    const dto = { email: 'test@example.com', password: 'password' };
    const result = await service.create(dto);
    expect(result).toHaveProperty('id');
  });
});
```

### 2. E2E Tests

```typescript
describe('Users (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  it('/users (GET)', () => {
    return request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.data).toBeInstanceOf(Array);
      });
  });
});
```

### 3. Test Coverage

```bash
# Run tests with coverage
npm run test:cov

# Aim for:
# - 80%+ line coverage
# - 70%+ branch coverage
# - 100% coverage for critical paths (auth, payments, etc.)
```

---

## Git Workflow

### 1. Commit Messages

Follow conventional commits:

```
feat: add user profile endpoint
fix: resolve authentication bug
docs: update API documentation
refactor: simplify user service
test: add unit tests for auth
chore: update dependencies
```

### 2. Branch Naming

```
feature/user-profile
bugfix/auth-token-expiry
hotfix/critical-security-patch
refactor/employee-service
```

### 3. Pull Request Guidelines

- Write descriptive PR titles and descriptions
- Reference related issues: "Closes #123"
- Request at least one code review
- Ensure all tests pass
- Update documentation if needed

---

## Code Review Checklist

### General
- [ ] Code follows project conventions
- [ ] No commented-out code
- [ ] No console.log statements (use Logger)
- [ ] No hardcoded values (use config)

### TypeScript
- [ ] Proper typing (no `any`)
- [ ] Interfaces defined for complex types
- [ ] Enums used for fixed sets of values

### NestJS
- [ ] DTOs have validation decorators
- [ ] Services use dependency injection
- [ ] Controllers are thin (logic in services)
- [ ] Proper use of guards and decorators

### Database
- [ ] Queries are optimized
- [ ] Indexes defined for commonly queried fields
- [ ] Transactions used for multi-step operations
- [ ] Migrations created for schema changes

### Security
- [ ] No secrets in code
- [ ] Input validation implemented
- [ ] Authorization checks in place
- [ ] Passwords are hashed

### Testing
- [ ] Unit tests added/updated
- [ ] E2E tests for new endpoints
- [ ] Edge cases covered
- [ ] Tests are passing

### Documentation
- [ ] Code comments for complex logic
- [ ] Swagger decorators on endpoints
- [ ] README updated if needed

---

## Performance Optimization

### 1. Database Queries

```typescript
// ✅ Use indexes
@@index([email])
@@index([departmentId, employmentStatus])

// ✅ Paginate large datasets
async findAll(page: number, limit: number) {
  return this.prisma.user.findMany({
    skip: (page - 1) * limit,
    take: limit,
  });
}

// ✅ Use select to reduce payload
select: { id: true, email: true }
```

### 2. Caching

```typescript
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    CacheModule.register({
      ttl: 300, // 5 minutes
      max: 100, // Max items in cache
    }),
  ],
})
```

### 3. Async Operations

```typescript
// ✅ Run independent operations in parallel
const [users, departments] = await Promise.all([
  this.userService.findAll(),
  this.departmentService.findAll(),
]);
```

---

## Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] Dependencies up to date
- [ ] Security audit completed
- [ ] Performance testing done

### Post-Deployment
- [ ] Health check endpoint working
- [ ] Logs monitoring configured
- [ ] Error tracking set up
- [ ] Database backup verified
- [ ] SSL certificate valid

---

## Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

---

## Contributing

When contributing to this project:

1. Read and follow these guidelines
2. Write clean, maintainable code
3. Add tests for new features
4. Update documentation
5. Request code review

For questions or suggestions, please open an issue or contact the development team.

---

**Last Updated:** May 2026
**Version:** 1.0.0
