# API Documentation

Complete API reference for the Employee Management System.

## Base URL

```
http://localhost:3000/api/v1
```

## Authentication

All endpoints except login and register require authentication using JWT Bearer tokens.

### Headers

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

---

## Authentication Endpoints

### Register User

Create a new user account.

**Endpoint:** `POST /auth/register`

**Access:** Public

**Request Body:**
```json
{
  "email": "john.doe@company.com",
  "password": "SecurePass@123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1-555-1234",
  "position": "Software Engineer",
  "departmentId": "uuid-of-department",
  "role": "EMPLOYEE"
}
```

**Response:** `201 Created`
```json
{
  "statusCode": 201,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "john.doe@company.com",
      "role": "EMPLOYEE",
      "employee": { ... }
    }
  }
}
```

---

### Login

Authenticate and receive access tokens.

**Endpoint:** `POST /auth/login`

**Access:** Public

**Request Body:**
```json
{
  "email": "admin@company.com",
  "password": "Admin@123"
}
```

**Response:** `200 OK`
```json
{
  "statusCode": 200,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "admin@company.com",
      "role": "ADMIN",
      "employee": { ... }
    }
  }
}
```

---

### Refresh Token

Get a new access token using refresh token.

**Endpoint:** `POST /auth/refresh`

**Access:** Public

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:** `200 OK`
```json
{
  "statusCode": 200,
  "data": {
    "accessToken": "new-access-token",
    "refreshToken": "new-refresh-token",
    "user": { ... }
  }
}
```

---

### Get Profile

Get current authenticated user's profile.

**Endpoint:** `GET /auth/profile`

**Access:** Authenticated users

**Response:** `200 OK`
```json
{
  "statusCode": 200,
  "data": {
    "id": "uuid",
    "email": "user@company.com",
    "role": "EMPLOYEE",
    "isActive": true,
    "employee": {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Doe",
      "position": "Software Engineer",
      "department": { ... }
    }
  }
}
```

---

## Employee Endpoints

### List Employees

Get all employees with filtering, sorting, and pagination.

**Endpoint:** `GET /employees`

**Access:** All authenticated users

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 10, max: 100) - Items per page
- `search` (string) - Search by name, email, or position
- `departmentId` (uuid) - Filter by department
- `employmentStatus` (enum) - Filter by status (ACTIVE, INACTIVE, ON_LEAVE, TERMINATED)
- `position` (string) - Filter by position
- `sortBy` (string) - Sort field (createdAt, name, position, salary, hireDate, department)
- `sortOrder` (string) - Sort order (asc, desc)

**Example:**
```
GET /employees?search=john&departmentId=uuid&page=1&limit=10&sortBy=lastName&sortOrder=asc
```

**Response:** `200 OK`
```json
{
  "statusCode": 200,
  "data": {
    "data": [
      {
        "id": "uuid",
        "firstName": "John",
        "lastName": "Doe",
        "position": "Software Engineer",
        "salary": 75000,
        "employmentStatus": "ACTIVE",
        "hireDate": "2024-01-15T00:00:00.000Z",
        "user": {
          "email": "john.doe@company.com",
          "role": "EMPLOYEE"
        },
        "department": {
          "id": "uuid",
          "name": "Information Technology"
        }
      }
    ],
    "meta": {
      "total": 50,
      "page": 1,
      "limit": 10,
      "totalPages": 5,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

---

### Get Employee by ID

Get detailed information about a specific employee.

**Endpoint:** `GET /employees/:id`

**Access:** All authenticated users

**Response:** `200 OK`
```json
{
  "statusCode": 200,
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1-555-1234",
    "dateOfBirth": "1990-01-15T00:00:00.000Z",
    "position": "Software Engineer",
    "salary": 75000,
    "hireDate": "2024-01-15T00:00:00.000Z",
    "employmentStatus": "ACTIVE",
    "address": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA",
    "emergencyContact": "Jane Doe: +1-555-5678",
    "notes": "Additional notes",
    "user": {
      "email": "john.doe@company.com",
      "role": "EMPLOYEE",
      "isActive": true
    },
    "department": {
      "id": "uuid",
      "name": "Information Technology",
      "location": "Building A, Floor 3"
    }
  }
}
```

---

### Create Employee

Create a new employee record.

**Endpoint:** `POST /employees`

**Access:** Admin, Manager

**Request Body:**
```json
{
  "userId": "uuid-of-user",
  "firstName": "Jane",
  "lastName": "Smith",
  "phone": "+1-555-9999",
  "dateOfBirth": "1992-05-20",
  "position": "Product Manager",
  "salary": 95000,
  "departmentId": "uuid-of-department",
  "employmentStatus": "ACTIVE",
  "address": "456 Oak Ave",
  "city": "San Francisco",
  "state": "CA",
  "zipCode": "94102",
  "country": "USA",
  "emergencyContact": "John Smith: +1-555-8888"
}
```

**Response:** `201 Created`
```json
{
  "statusCode": 201,
  "data": {
    "id": "uuid",
    "firstName": "Jane",
    "lastName": "Smith",
    ...
  }
}
```

---

### Update Employee

Update employee information.

**Endpoint:** `PATCH /employees/:id`

**Access:** Admin, Manager

**Request Body:**
```json
{
  "position": "Senior Product Manager",
  "salary": 110000,
  "employmentStatus": "ACTIVE"
}
```

**Response:** `200 OK`

---

### Delete Employee

Delete an employee record.

**Endpoint:** `DELETE /employees/:id`

**Access:** Admin only

**Response:** `200 OK`
```json
{
  "statusCode": 200,
  "data": {
    "message": "Employee deleted successfully"
  }
}
```

---

### Search Employees

Quick search for employees by name or email.

**Endpoint:** `GET /employees/search`

**Access:** All authenticated users

**Query Parameters:**
- `q` (string, required) - Search query
- `limit` (number, default: 10) - Max results

**Example:**
```
GET /employees/search?q=john&limit=5
```

**Response:** `200 OK`
```json
{
  "statusCode": 200,
  "data": [
    {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Doe",
      "user": {
        "email": "john.doe@company.com"
      },
      "department": {
        "name": "IT"
      }
    }
  ]
}
```

---

### Get Employee Statistics

Get overall employee statistics.

**Endpoint:** `GET /employees/statistics`

**Access:** Admin, Manager

**Response:** `200 OK`
```json
{
  "statusCode": 200,
  "data": {
    "totalEmployees": 150,
    "activeEmployees": 140,
    "inactiveEmployees": 10,
    "departmentCount": 8,
    "averageSalary": 75000
  }
}
```

---

### Get My Profile

Get current employee's profile.

**Endpoint:** `GET /employees/me`

**Access:** All authenticated users

**Response:** `200 OK`

---

### Assign Department

Assign employee to a department.

**Endpoint:** `POST /employees/:id/assign-department`

**Access:** Admin, Manager

**Request Body:**
```json
{
  "departmentId": "uuid-of-department"
}
```

**Response:** `200 OK`

---

### Remove from Department

Remove employee from their department.

**Endpoint:** `POST /employees/:id/remove-department`

**Access:** Admin, Manager

**Response:** `200 OK`

---

## Department Endpoints

### List Departments

Get all departments.

**Endpoint:** `GET /departments`

**Access:** All authenticated users

**Query Parameters:**
- `page` (number) - Page number
- `limit` (number) - Items per page
- `includeInactive` (boolean) - Include inactive departments

**Response:** `200 OK`
```json
{
  "statusCode": 200,
  "data": {
    "data": [
      {
        "id": "uuid",
        "name": "Information Technology",
        "description": "IT Department",
        "location": "Building A, Floor 3",
        "isActive": true,
        "_count": {
          "employees": 25
        }
      }
    ],
    "meta": { ... }
  }
}
```

---

### Get Simple Department List

Get simplified list for dropdowns.

**Endpoint:** `GET /departments/simple`

**Access:** All authenticated users

**Response:** `200 OK`
```json
{
  "statusCode": 200,
  "data": [
    {
      "id": "uuid",
      "name": "Information Technology",
      "location": "Building A, Floor 3"
    }
  ]
}
```

---

### Get Department by ID

Get detailed department information.

**Endpoint:** `GET /departments/:id`

**Access:** All authenticated users

**Response:** `200 OK`
```json
{
  "statusCode": 200,
  "data": {
    "id": "uuid",
    "name": "Information Technology",
    "description": "IT Department",
    "location": "Building A, Floor 3",
    "isActive": true,
    "employees": [
      {
        "id": "uuid",
        "firstName": "John",
        "lastName": "Doe",
        "position": "Software Engineer",
        "employmentStatus": "ACTIVE"
      }
    ],
    "_count": {
      "employees": 25
    }
  }
}
```

---

### Create Department

Create a new department.

**Endpoint:** `POST /departments`

**Access:** Admin only

**Request Body:**
```json
{
  "name": "Marketing",
  "description": "Marketing and Communications Department",
  "location": "Building B, Floor 1"
}
```

**Response:** `201 Created`

---

### Update Department

Update department information.

**Endpoint:** `PATCH /departments/:id`

**Access:** Admin, Manager

**Request Body:**
```json
{
  "name": "Digital Marketing",
  "description": "Updated description"
}
```

**Response:** `200 OK`

---

### Delete Department

Delete a department (only if no employees assigned).

**Endpoint:** `DELETE /departments/:id`

**Access:** Admin only

**Response:** `200 OK`

---

### Get Department Statistics

Get statistics for a specific department.

**Endpoint:** `GET /departments/:id/statistics`

**Access:** Admin, Manager

**Response:** `200 OK`
```json
{
  "statusCode": 200,
  "data": {
    "department": {
      "id": "uuid",
      "name": "Information Technology"
    },
    "statistics": {
      "totalEmployees": 25,
      "activeEmployees": 23,
      "averageSalary": 82000
    }
  }
}
```

---

## User Endpoints

### List Users

Get all users.

**Endpoint:** `GET /users`

**Access:** Admin, Manager

**Query Parameters:**
- `includeInactive` (boolean) - Include inactive users

**Response:** `200 OK`

---

### Get User by ID

**Endpoint:** `GET /users/:id`

**Access:** All authenticated users (own profile or Admin/Manager)

**Response:** `200 OK`

---

### Update User

**Endpoint:** `PATCH /users/:id`

**Access:** Admin (all fields), Users (own email only)

**Request Body:**
```json
{
  "email": "newemail@company.com",
  "role": "MANAGER",
  "isActive": true
}
```

**Response:** `200 OK`

---

### Change Password

**Endpoint:** `POST /users/:id/change-password`

**Access:** Admin (any user), Users (own password)

**Request Body:**
```json
{
  "currentPassword": "OldPass@123",
  "newPassword": "NewPass@123"
}
```

**Response:** `200 OK`

---

### Activate User

**Endpoint:** `POST /users/:id/activate`

**Access:** Admin only

**Response:** `200 OK`

---

### Deactivate User

**Endpoint:** `POST /users/:id/deactivate`

**Access:** Admin only

**Response:** `200 OK`

---

### Delete User

**Endpoint:** `DELETE /users/:id`

**Access:** Admin only

**Response:** `200 OK`

---

### Get Audit Logs

Get system audit logs.

**Endpoint:** `GET /users/audit-logs/all`

**Access:** Admin only

**Query Parameters:**
- `userId` (uuid) - Filter by user
- `entity` (string) - Filter by entity (User, Employee, Department)
- `page` (number)
- `limit` (number)

**Response:** `200 OK`
```json
{
  "statusCode": 200,
  "data": {
    "data": [
      {
        "id": "uuid",
        "action": "CREATE",
        "entity": "Employee",
        "entityId": "uuid",
        "details": { ... },
        "createdAt": "2024-01-01T10:00:00.000Z",
        "user": {
          "email": "admin@company.com"
        }
      }
    ],
    "meta": { ... }
  }
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized",
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Insufficient permissions. Required roles: ADMIN",
  "error": "Forbidden",
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Employee not found",
  "error": "Not Found",
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

### 409 Conflict
```json
{
  "statusCode": 409,
  "message": "User with this email already exists",
  "error": "Conflict",
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error",
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

---

## Rate Limiting

API endpoints are rate-limited to prevent abuse:
- **Default:** 100 requests per minute per IP
- **Authentication endpoints:** 5 requests per minute per IP

---

## Postman Collection

A Postman collection is available for testing the API. Import the collection from:
`/postman/Employee-Management-System.postman_collection.json`

---

For more information, visit the interactive API documentation at `/api/docs` when the server is running.
