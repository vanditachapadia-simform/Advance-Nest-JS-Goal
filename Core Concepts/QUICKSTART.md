# Quick Start Guide

This guide will help you get the Employee Management System up and running quickly.

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **PostgreSQL** (v14 or higher) - [Download](https://www.postgresql.org/download/)
- **npm** or **yarn** package manager

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` and update the following:

```env
# Database connection string
DATABASE_URL="postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/employee_management?schema=public"

# JWT secrets (use strong random strings in production)
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
```

### 3. Set Up the Database

```bash
# Generate Prisma Client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed the database with sample data (optional but recommended)
npm run prisma:seed
```

### 4. Start the Application

**Development mode (with hot reload):**
```bash
npm run start:dev
```

**Production mode:**
```bash
npm run build
npm run start:prod
```

The application will start on `http://localhost:3000`

### 5. Access API Documentation

Once the application is running, open your browser and navigate to:

**Swagger UI:** [http://localhost:3000/api/docs](http://localhost:3000/api/docs)

## Default User Accounts

After seeding, you can log in with these accounts:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@company.com | Admin@123 |
| **Manager** | manager@company.com | Manager@123 |
| **Employee** | employee@company.com | Employee@123 |

## Quick API Test

### 1. Login to Get Access Token

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@company.com",
    "password": "Admin@123"
  }'
```

You'll receive a response with an `accessToken`:

```json
{
  "statusCode": 200,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { ... }
  }
}
```

### 2. Use the Token to Access Protected Endpoints

```bash
curl -X GET http://localhost:3000/api/v1/employees \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Common Commands

### Development
```bash
npm run start:dev          # Start with hot reload
npm run start:debug        # Start in debug mode
```

### Database
```bash
npm run prisma:studio      # Open Prisma Studio (Database GUI)
npm run prisma:migrate     # Create and apply new migration
npm run prisma:generate    # Generate Prisma Client
npm run prisma:seed        # Seed database
```

### Testing
```bash
npm run test              # Run unit tests
npm run test:watch        # Run tests in watch mode
npm run test:cov          # Run tests with coverage
npm run test:e2e          # Run end-to-end tests
```

### Code Quality
```bash
npm run lint              # Lint code
npm run format            # Format code with Prettier
```

## Project Structure Overview

```
src/
├── common/               # Shared utilities (decorators, filters, guards, etc.)
├── config/              # Configuration files (Prisma, database)
├── modules/             # Feature modules
│   ├── auth/           # Authentication (login, register, JWT)
│   ├── user/           # User management (CRUD, roles)
│   ├── employee/       # Employee management (full CRUD)
│   └── department/     # Department management
├── app.module.ts       # Root module
├── app.controller.ts   # Root controller (health checks)
└── main.ts            # Application entry point
```

## Key Features

### 🔐 Authentication
- JWT-based authentication
- Login and registration
- Token refresh mechanism
- Role-based access control (RBAC)

### 👥 User Management
- User CRUD operations
- Password change
- User activation/deactivation
- Role management (Admin, Manager, Employee)

### 👔 Employee Management
- Full CRUD operations
- Advanced filtering and search
- Pagination and sorting
- Department assignment
- Employee statistics

### 🏢 Department Management
- Department CRUD
- Employee listing per department
- Department statistics

### 📊 Audit Logs
- Track all important system activities
- User action logging
- Audit trail for compliance

## API Endpoints Overview

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/refresh` - Refresh access token
- `GET /api/v1/auth/profile` - Get current user profile

### Users
- `GET /api/v1/users` - List all users
- `GET /api/v1/users/:id` - Get user by ID
- `PATCH /api/v1/users/:id` - Update user
- `POST /api/v1/users/:id/change-password` - Change password
- `DELETE /api/v1/users/:id` - Delete user

### Employees
- `GET /api/v1/employees` - List employees (with filters)
- `GET /api/v1/employees/:id` - Get employee by ID
- `POST /api/v1/employees` - Create employee
- `PATCH /api/v1/employees/:id` - Update employee
- `DELETE /api/v1/employees/:id` - Delete employee
- `GET /api/v1/employees/statistics` - Get statistics

### Departments
- `GET /api/v1/departments` - List departments
- `GET /api/v1/departments/:id` - Get department by ID
- `POST /api/v1/departments` - Create department
- `PATCH /api/v1/departments/:id` - Update department
- `DELETE /api/v1/departments/:id` - Delete department
- `GET /api/v1/departments/:id/statistics` - Get statistics

## Advanced Features

### Filtering and Searching
```bash
# Search employees by name or email
GET /api/v1/employees?search=john

# Filter by department
GET /api/v1/employees?departmentId=uuid

# Filter by employment status
GET /api/v1/employees?employmentStatus=ACTIVE

# Combine filters
GET /api/v1/employees?search=john&departmentId=uuid&page=1&limit=10
```

### Sorting
```bash
# Sort by field (name, position, salary, hireDate)
GET /api/v1/employees?sortBy=salary&sortOrder=desc
```

### Pagination
```bash
# Get page 2 with 20 items per page
GET /api/v1/employees?page=2&limit=20
```

## Troubleshooting

### Database Connection Issues

If you see database connection errors:

1. Verify PostgreSQL is running:
   ```bash
   sudo systemctl status postgresql
   ```

2. Check your DATABASE_URL in `.env`

3. Ensure the database exists:
   ```bash
   psql -U postgres
   CREATE DATABASE employee_management;
   ```

### Port Already in Use

If port 3000 is already in use:

1. Change the port in `.env`:
   ```env
   PORT=3001
   ```

2. Or kill the process using port 3000:
   ```bash
   lsof -ti:3000 | xargs kill -9
   ```

### Prisma Issues

If you encounter Prisma-related errors:

```bash
# Regenerate Prisma Client
npm run prisma:generate

# Reset database (WARNING: This will delete all data)
npx prisma migrate reset
```

## Next Steps

1. **Explore the API**: Use the Swagger documentation at `/api/docs`
2. **Read the Code**: Check out the modules in `src/modules/`
3. **Review Best Practices**: Read `INSTRUCTIONS.md` for coding standards
4. **Add Features**: Extend the system with new modules
5. **Write Tests**: Add unit and E2E tests for new features

## Getting Help

- **Documentation**: See `README.md` and `INSTRUCTIONS.md`
- **API Docs**: Visit `/api/docs` when the server is running
- **Issues**: Check existing issues or create a new one

## Production Deployment

For production deployment:

1. Set `NODE_ENV=production` in your environment
2. Use strong, unique values for JWT secrets
3. Enable SSL/TLS for database connections
4. Set up proper logging and monitoring
5. Configure rate limiting and CORS properly
6. Run database migrations: `npm run prisma:migrate:prod`
7. Use a process manager like PM2

```bash
# Example production start with PM2
pm2 start npm --name "employee-api" -- run start:prod
```

---

**Happy Coding! 🚀**

For more detailed information, refer to the main [README.md](README.md) and [INSTRUCTIONS.md](INSTRUCTIONS.md).
