# Employee Management System

A comprehensive Employee Management System built with NestJS, Prisma ORM, PostgreSQL, and following enterprise-grade architecture patterns.

## 🚀 Features

- **Employee Management**: Complete CRUD operations for employees
- **Department Management**: Organize employees by departments
- **Authentication & Authorization**: JWT-based authentication with role-based access control (RBAC)
- **User Management**: Admin, Manager, and Employee roles
- **Advanced Filtering**: Search, filter, sort, and paginate through records
- **Audit Logs**: Track all important system activities
- **API Documentation**: Auto-generated Swagger/OpenAPI documentation
- **Type Safety**: Full TypeScript support with strict typing
- **Database Migrations**: Prisma-powered database migrations
- **Testing**: Unit and integration tests included

## 🏗️ Architecture

The project follows a scalable modular architecture:

```
src/
├── common/                 # Shared utilities and common functionality
│   ├── decorators/        # Custom decorators
│   ├── filters/           # Exception filters
│   ├── guards/            # Authentication & authorization guards
│   ├── interceptors/      # Request/response interceptors
│   ├── middleware/        # Custom middleware
│   └── pipes/             # Validation and transformation pipes
├── config/                # Configuration modules
├── modules/               # Feature modules
│   ├── auth/             # Authentication
│   ├── user/             # User management
│   ├── employee/         # Employee management
│   └── department/       # Department management
└── prisma/               # Database schema and migrations
```

## 📋 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd employee-management-system
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your database credentials and other configurations
```

4. **Set up the database**
```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed the database (optional)
npm run prisma:seed
```

## 🚀 Running the Application

### Development mode
```bash
npm run start:dev
```

### Production mode
```bash
npm run build
npm run start:prod
```

### Debug mode
```bash
npm run start:debug
```

The application will be available at: `http://localhost:3000`

API Documentation (Swagger): `http://localhost:3000/api/docs`

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📚 API Documentation

Once the application is running, visit:
- Swagger UI: `http://localhost:3000/api/docs`
- JSON spec: `http://localhost:3000/api/docs-json`

## 🔐 Default Users

After seeding, the following users are available:

| Email | Password | Role |
|-------|----------|------|
| admin@company.com | Admin@123 | ADMIN |
| manager@company.com | Manager@123 | MANAGER |
| employee@company.com | Employee@123 | EMPLOYEE |

## 🗄️ Database Management

```bash
# Open Prisma Studio (Database GUI)
npm run prisma:studio

# Create a new migration
npm run prisma:migrate

# Deploy migrations to production
npm run prisma:migrate:prod

# Reset database (CAUTION: Deletes all data)
npx prisma migrate reset
```

## 📝 Core Modules

### Authentication Module
- Login/Register functionality
- JWT token generation and validation
- Password hashing with bcrypt
- Refresh token support

### User Module
- User CRUD operations
- Role-based access control
- Profile management

### Employee Module
- Employee CRUD with advanced filtering
- Search by name, email, department
- Pagination and sorting
- Department assignment

### Department Module
- Department CRUD operations
- Employee listing per department
- Department statistics

## 🔧 Configuration

Key configuration files:
- `.env` - Environment variables
- `prisma/schema.prisma` - Database schema
- `src/config/` - Application configuration modules

## 📦 Tech Stack

- **Framework**: NestJS 10.x
- **Language**: TypeScript
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Authentication**: JWT (Passport)
- **Validation**: class-validator, class-transformer
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest

## 🤝 Contributing

Please read `INSTRUCTIONS.md` for coding standards and best practices.

## 📄 License

This project is licensed under the MIT License.

## 👥 Support

For issues and questions, please create an issue in the repository.
