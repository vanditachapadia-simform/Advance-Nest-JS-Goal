import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create Departments
  const itDepartment = await prisma.department.upsert({
    where: { name: 'Information Technology' },
    update: {},
    create: {
      name: 'Information Technology',
      description: 'IT Department handling all technology infrastructure',
      location: 'Building A, Floor 3',
    },
  });

  const hrDepartment = await prisma.department.upsert({
    where: { name: 'Human Resources' },
    update: {},
    create: {
      name: 'Human Resources',
      description: 'HR Department managing employee relations and recruitment',
      location: 'Building B, Floor 2',
    },
  });

  const financeDepartment = await prisma.department.upsert({
    where: { name: 'Finance' },
    update: {},
    create: {
      name: 'Finance',
      description: 'Finance Department managing company finances',
      location: 'Building B, Floor 1',
    },
  });

  console.log('Departments created');

  // Create Users with Employees
  const hashedPassword = await bcrypt.hash('Admin@123', 10);

  // Admin User
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@company.com' },
    update: {},
    create: {
      email: 'admin@company.com',
      password: hashedPassword,
      role: Role.ADMIN,
      employee: {
        create: {
          firstName: 'John',
          lastName: 'Admin',
          phone: '+1-555-0001',
          position: 'System Administrator',
          salary: 120000,
          departmentId: itDepartment.id,
          dateOfBirth: new Date('1985-05-15'),
          address: '123 Admin St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA',
        },
      },
    },
  });

  // Manager User
  const managerPassword = await bcrypt.hash('Manager@123', 10);
  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@company.com' },
    update: {},
    create: {
      email: 'manager@company.com',
      password: managerPassword,
      role: Role.MANAGER,
      employee: {
        create: {
          firstName: 'Sarah',
          lastName: 'Manager',
          phone: '+1-555-0002',
          position: 'HR Manager',
          salary: 95000,
          departmentId: hrDepartment.id,
          dateOfBirth: new Date('1988-08-20'),
          address: '456 Manager Ave',
          city: 'New York',
          state: 'NY',
          zipCode: '10002',
          country: 'USA',
        },
      },
    },
  });

  // Employee User
  const employeePassword = await bcrypt.hash('Employee@123', 10);
  const employeeUser = await prisma.user.upsert({
    where: { email: 'employee@company.com' },
    update: {},
    create: {
      email: 'employee@company.com',
      password: employeePassword,
      role: Role.EMPLOYEE,
      employee: {
        create: {
          firstName: 'Mike',
          lastName: 'Employee',
          phone: '+1-555-0003',
          position: 'Software Developer',
          salary: 75000,
          departmentId: itDepartment.id,
          dateOfBirth: new Date('1992-03-10'),
          address: '789 Employee Rd',
          city: 'New York',
          state: 'NY',
          zipCode: '10003',
          country: 'USA',
        },
      },
    },
  });

  // Additional Employees
  const janePassword = await bcrypt.hash('Jane@123', 10);
  await prisma.user.upsert({
    where: { email: 'jane.doe@company.com' },
    update: {},
    create: {
      email: 'jane.doe@company.com',
      password: janePassword,
      role: Role.EMPLOYEE,
      employee: {
        create: {
          firstName: 'Jane',
          lastName: 'Doe',
          phone: '+1-555-0004',
          position: 'Financial Analyst',
          salary: 70000,
          departmentId: financeDepartment.id,
          dateOfBirth: new Date('1990-11-25'),
          address: '321 Finance Blvd',
          city: 'New York',
          state: 'NY',
          zipCode: '10004',
          country: 'USA',
        },
      },
    },
  });

  const bobPassword = await bcrypt.hash('Bob@123', 10);
  await prisma.user.upsert({
    where: { email: 'bob.smith@company.com' },
    update: {},
    create: {
      email: 'bob.smith@company.com',
      password: bobPassword,
      role: Role.EMPLOYEE,
      employee: {
        create: {
          firstName: 'Bob',
          lastName: 'Smith',
          phone: '+1-555-0005',
          position: 'HR Coordinator',
          salary: 55000,
          departmentId: hrDepartment.id,
          dateOfBirth: new Date('1994-07-12'),
          address: '654 HR Street',
          city: 'New York',
          state: 'NY',
          zipCode: '10005',
          country: 'USA',
        },
      },
    },
  });

  console.log('Users and Employees created');
  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
