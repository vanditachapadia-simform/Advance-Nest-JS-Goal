import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { describe, beforeEach, it, expect, jest } from '@jest/globals';
import { EmployeeService } from './employee.service';
import { PrismaService } from '../../config/prisma.service';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { FilterEmployeeDto } from './dto/filter-employee.dto';

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const EMPLOYEE_ID = 'emp-uuid-1';
const MANAGER_ID = 'emp-uuid-2';
const USER_ID = 'user-uuid-1';
const DEPT_ID = 'dept-uuid-1';

const mockUser = {
  id: USER_ID,
  email: 'john@example.com',
  role: 'EMPLOYEE',
  isActive: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const mockDepartment = {
  id: DEPT_ID,
  name: 'Engineering',
  location: 'HQ',
};

const mockEmployee = {
  id: EMPLOYEE_ID,
  userId: USER_ID,
  firstName: 'John',
  lastName: 'Doe',
  position: 'Software Engineer',
  employmentStatus: 'ACTIVE',
  salary: 75000,
  departmentId: DEPT_ID,
  managerId: null,
  user: mockUser,
  department: mockDepartment,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const mockManager = {
  id: MANAGER_ID,
  userId: 'user-uuid-2',
  firstName: 'Jane',
  lastName: 'Smith',
  position: 'Engineering Manager',
  employmentStatus: 'ACTIVE',
  salary: 110000,
  departmentId: DEPT_ID,
  managerId: null,
  user: { id: 'user-uuid-2', email: 'jane@example.com', role: 'MANAGER' },
  department: mockDepartment,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

// ---------------------------------------------------------------------------
// Mock PrismaService
// ---------------------------------------------------------------------------

const mockPrismaService: any = {
  employee: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
  },
  department: {
    findUnique: jest.fn(),
    count: jest.fn(),
  },
};

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('EmployeeService', () => {
  let service: EmployeeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeeService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<EmployeeService>(EmployeeService);

    // Reset all mocks between tests so call history and return values do not bleed across cases
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // =========================================================================
  // create
  // =========================================================================

  describe('create', () => {
    const createDto: CreateEmployeeDto = {
      userId: USER_ID,
      firstName: 'John',
      lastName: 'Doe',
      position: 'Software Engineer',
    };

    it('should create and return an employee with user and department included', async () => {
      mockPrismaService.employee.create.mockResolvedValue(mockEmployee);

      const result = await service.create(createDto);

      expect(mockPrismaService.employee.create).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.employee.create).toHaveBeenCalledWith({
        data: createDto,
        include: {
          user: { select: { id: true, email: true, role: true } },
          department: true,
        },
      });
      expect(result).toEqual(mockEmployee);
    });
  });

  // =========================================================================
  // findAll
  // =========================================================================

  describe('findAll', () => {
    it('should return a paginated response with default pagination values', async () => {
      const employees = [mockEmployee];
      mockPrismaService.employee.findMany.mockResolvedValue(employees);
      mockPrismaService.employee.count.mockResolvedValue(1);

      const filterDto: FilterEmployeeDto = {};
      const result = await service.findAll(filterDto);

      expect(mockPrismaService.employee.findMany).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.employee.count).toHaveBeenCalledTimes(1);
      expect(result).toBeInstanceOf(PaginatedResponseDto);
      expect(result.data).toEqual(employees);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
    });

    it('should apply search filter to OR clause', async () => {
      mockPrismaService.employee.findMany.mockResolvedValue([]);
      mockPrismaService.employee.count.mockResolvedValue(0);

      await service.findAll({ search: 'john' });

      const callArgs = mockPrismaService.employee.findMany.mock.calls[0][0];
      expect(callArgs.where.OR).toBeDefined();
      expect(callArgs.where.OR).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ firstName: { contains: 'john', mode: 'insensitive' } }),
          expect.objectContaining({ lastName: { contains: 'john', mode: 'insensitive' } }),
        ]),
      );
    });

    it('should apply departmentId filter when provided', async () => {
      mockPrismaService.employee.findMany.mockResolvedValue([]);
      mockPrismaService.employee.count.mockResolvedValue(0);

      await service.findAll({ departmentId: DEPT_ID });

      const callArgs = mockPrismaService.employee.findMany.mock.calls[0][0];
      expect(callArgs.where.departmentId).toBe(DEPT_ID);
    });

    it('should apply employmentStatus filter when provided', async () => {
      mockPrismaService.employee.findMany.mockResolvedValue([]);
      mockPrismaService.employee.count.mockResolvedValue(0);

      await service.findAll({ employmentStatus: 'ACTIVE' as any });

      const callArgs = mockPrismaService.employee.findMany.mock.calls[0][0];
      expect(callArgs.where.employmentStatus).toBe('ACTIVE');
    });

    it('should sort by lastName when sortBy is "name"', async () => {
      mockPrismaService.employee.findMany.mockResolvedValue([]);
      mockPrismaService.employee.count.mockResolvedValue(0);

      await service.findAll({ sortBy: 'name', sortOrder: 'asc' });

      const callArgs = mockPrismaService.employee.findMany.mock.calls[0][0];
      expect(callArgs.orderBy).toEqual({ lastName: 'asc' });
    });

    it('should calculate correct skip offset based on page and limit', async () => {
      mockPrismaService.employee.findMany.mockResolvedValue([]);
      mockPrismaService.employee.count.mockResolvedValue(50);

      await service.findAll({ page: 3, limit: 10 });

      const callArgs = mockPrismaService.employee.findMany.mock.calls[0][0];
      expect(callArgs.skip).toBe(20);
      expect(callArgs.take).toBe(10);
    });
  });

  // =========================================================================
  // findOne
  // =========================================================================

  describe('findOne', () => {
    it('should return an employee when found', async () => {
      mockPrismaService.employee.findUnique.mockResolvedValue(mockEmployee);

      const result = await service.findOne(EMPLOYEE_ID);

      expect(mockPrismaService.employee.findUnique).toHaveBeenCalledWith({
        where: { id: EMPLOYEE_ID },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
              isActive: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          department: true,
        },
      });
      expect(result).toEqual(mockEmployee);
    });

    it('should throw NotFoundException when employee does not exist', async () => {
      mockPrismaService.employee.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        new NotFoundException('Employee not found'),
      );
    });
  });

  // =========================================================================
  // assignManager
  // =========================================================================

  describe('assignManager', () => {
    it('should throw Error when employeeId equals managerId (self-assignment)', async () => {
      await expect(
        service.assignManager(EMPLOYEE_ID, EMPLOYEE_ID),
      ).rejects.toThrow('An employee cannot be their own manager');

      // Neither findUnique nor findOne should be called
      expect(mockPrismaService.employee.findUnique).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when the target employee does not exist', async () => {
      // findOne delegates to findUnique; return null so findOne throws
      mockPrismaService.employee.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.assignManager('non-existent-emp', MANAGER_ID),
      ).rejects.toThrow(new NotFoundException('Employee not found'));

      expect(mockPrismaService.employee.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when the manager employee does not exist', async () => {
      // First call: findOne(employeeId) → employee found
      mockPrismaService.employee.findUnique
        .mockResolvedValueOnce(mockEmployee) // findOne(employeeId)
        .mockResolvedValueOnce(null);         // findUnique for manager

      await expect(
        service.assignManager(EMPLOYEE_ID, 'non-existent-manager'),
      ).rejects.toThrow(new NotFoundException('Manager employee not found'));

      expect(mockPrismaService.employee.update).not.toHaveBeenCalled();
    });

    it('should update managerId and return the employee with manager included', async () => {
      const updatedEmployee = {
        ...mockEmployee,
        managerId: MANAGER_ID,
        manager: mockManager,
      };

      mockPrismaService.employee.findUnique
        .mockResolvedValueOnce(mockEmployee) // findOne(employeeId)
        .mockResolvedValueOnce(mockManager); // manager lookup

      mockPrismaService.employee.update.mockResolvedValue(updatedEmployee);

      const result = await service.assignManager(EMPLOYEE_ID, MANAGER_ID);

      expect(mockPrismaService.employee.update).toHaveBeenCalledWith({
        where: { id: EMPLOYEE_ID },
        data: { managerId: MANAGER_ID },
        include: {
          user: { select: { id: true, email: true, role: true } },
          department: true,
          manager: {
            include: { user: { select: { id: true, email: true, role: true } } },
          },
        },
      });
      expect(result).toEqual(updatedEmployee);
      expect(result.managerId).toBe(MANAGER_ID);
    });
  });

  // =========================================================================
  // removeManager
  // =========================================================================

  describe('removeManager', () => {
    it('should throw NotFoundException when employee does not exist', async () => {
      mockPrismaService.employee.findUnique.mockResolvedValue(null);

      await expect(service.removeManager('non-existent-id')).rejects.toThrow(
        new NotFoundException('Employee not found'),
      );

      expect(mockPrismaService.employee.update).not.toHaveBeenCalled();
    });

    it('should set managerId to null and return the updated employee', async () => {
      const updatedEmployee = { ...mockEmployee, managerId: null };

      mockPrismaService.employee.findUnique.mockResolvedValue(mockEmployee);
      mockPrismaService.employee.update.mockResolvedValue(updatedEmployee);

      const result = await service.removeManager(EMPLOYEE_ID);

      expect(mockPrismaService.employee.update).toHaveBeenCalledWith({
        where: { id: EMPLOYEE_ID },
        data: { managerId: null },
        include: {
          user: { select: { id: true, email: true, role: true } },
          department: true,
        },
      });
      expect(result.managerId).toBeNull();
    });

    it('should call findOne before performing the update', async () => {
      const updatedEmployee = { ...mockEmployee, managerId: null };

      mockPrismaService.employee.findUnique.mockResolvedValue(mockEmployee);
      mockPrismaService.employee.update.mockResolvedValue(updatedEmployee);

      await service.removeManager(EMPLOYEE_ID);

      // findUnique is called once (via findOne) before the update
      expect(mockPrismaService.employee.findUnique).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.employee.update).toHaveBeenCalledTimes(1);
    });
  });

  // =========================================================================
  // getDirectReports
  // =========================================================================

  describe('getDirectReports', () => {
    it('should throw NotFoundException when the manager employee does not exist', async () => {
      mockPrismaService.employee.findUnique.mockResolvedValue(null);

      await expect(service.getDirectReports('non-existent-manager')).rejects.toThrow(
        new NotFoundException('Employee not found'),
      );

      expect(mockPrismaService.employee.findMany).not.toHaveBeenCalled();
    });

    it('should return direct reports ordered by lastName then firstName', async () => {
      const directReports = [
        { ...mockEmployee, id: 'emp-3', firstName: 'Alice', lastName: 'Brown', managerId: MANAGER_ID },
        { ...mockEmployee, id: 'emp-4', firstName: 'Bob', lastName: 'Brown', managerId: MANAGER_ID },
      ];

      mockPrismaService.employee.findUnique.mockResolvedValue(mockManager);
      mockPrismaService.employee.findMany.mockResolvedValue(directReports);

      const result = await service.getDirectReports(MANAGER_ID);

      expect(mockPrismaService.employee.findMany).toHaveBeenCalledWith({
        where: { managerId: MANAGER_ID },
        include: {
          user: { select: { id: true, email: true, role: true, isActive: true } },
          department: { select: { id: true, name: true, location: true } },
        },
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      });
      expect(result).toEqual(directReports);
    });

    it('should return an empty array when the manager has no direct reports', async () => {
      mockPrismaService.employee.findUnique.mockResolvedValue(mockManager);
      mockPrismaService.employee.findMany.mockResolvedValue([]);

      const result = await service.getDirectReports(MANAGER_ID);

      expect(result).toEqual([]);
    });
  });

  // =========================================================================
  // getManager
  // =========================================================================

  describe('getManager', () => {
    it('should throw NotFoundException when employee does not exist', async () => {
      mockPrismaService.employee.findUnique.mockResolvedValue(null);

      await expect(service.getManager('non-existent-id')).rejects.toThrow(
        new NotFoundException('Employee not found'),
      );
    });

    it('should return null when employee has no manager', async () => {
      const employeeWithoutManager = { ...mockEmployee, managerId: null, manager: null };
      mockPrismaService.employee.findUnique.mockResolvedValue(employeeWithoutManager);

      const result = await service.getManager(EMPLOYEE_ID);

      expect(result).toBeNull();
    });

    it('should return the manager object when employee has a manager', async () => {
      const employeeWithManager = {
        ...mockEmployee,
        managerId: MANAGER_ID,
        manager: mockManager,
      };
      mockPrismaService.employee.findUnique.mockResolvedValue(employeeWithManager);

      const result = await service.getManager(EMPLOYEE_ID);

      expect(result).toEqual(mockManager);
    });

    it('should query with the correct include shape', async () => {
      const employeeWithManager = {
        ...mockEmployee,
        managerId: MANAGER_ID,
        manager: mockManager,
      };
      mockPrismaService.employee.findUnique.mockResolvedValue(employeeWithManager);

      await service.getManager(EMPLOYEE_ID);

      expect(mockPrismaService.employee.findUnique).toHaveBeenCalledWith({
        where: { id: EMPLOYEE_ID },
        include: {
          manager: {
            include: {
              user: { select: { id: true, email: true, role: true, isActive: true } },
              department: { select: { id: true, name: true, location: true } },
            },
          },
        },
      });
    });
  });

  // =========================================================================
  // update
  // =========================================================================

  describe('update', () => {
    it('should throw NotFoundException when employee does not exist', async () => {
      mockPrismaService.employee.findUnique.mockResolvedValue(null);

      await expect(service.update('non-existent-id', { position: 'Lead' })).rejects.toThrow(
        new NotFoundException('Employee not found'),
      );

      expect(mockPrismaService.employee.update).not.toHaveBeenCalled();
    });

    it('should update and return the employee when found', async () => {
      const updatedEmployee = { ...mockEmployee, position: 'Senior Engineer' };

      mockPrismaService.employee.findUnique.mockResolvedValue(mockEmployee);
      mockPrismaService.employee.update.mockResolvedValue(updatedEmployee);

      const result = await service.update(EMPLOYEE_ID, { position: 'Senior Engineer' });

      expect(mockPrismaService.employee.update).toHaveBeenCalledWith({
        where: { id: EMPLOYEE_ID },
        data: { position: 'Senior Engineer' },
        include: {
          user: { select: { id: true, email: true, role: true } },
          department: true,
        },
      });
      expect(result.position).toBe('Senior Engineer');
    });
  });

  // =========================================================================
  // remove
  // =========================================================================

  describe('remove', () => {
    it('should throw NotFoundException when employee does not exist', async () => {
      mockPrismaService.employee.findUnique.mockResolvedValue(null);

      await expect(service.remove('non-existent-id')).rejects.toThrow(
        new NotFoundException('Employee not found'),
      );

      expect(mockPrismaService.employee.delete).not.toHaveBeenCalled();
    });

    it('should delete the employee and return a success message', async () => {
      mockPrismaService.employee.findUnique.mockResolvedValue(mockEmployee);
      mockPrismaService.employee.delete.mockResolvedValue(mockEmployee);

      const result = await service.remove(EMPLOYEE_ID);

      expect(mockPrismaService.employee.delete).toHaveBeenCalledWith({
        where: { id: EMPLOYEE_ID },
      });
      expect(result).toEqual({ message: 'Employee deleted successfully' });
    });
  });

  // =========================================================================
  // assignDepartment
  // =========================================================================

  describe('assignDepartment', () => {
    it('should throw NotFoundException when employee does not exist', async () => {
      mockPrismaService.employee.findUnique.mockResolvedValue(null);

      await expect(
        service.assignDepartment('non-existent-emp', DEPT_ID),
      ).rejects.toThrow(new NotFoundException('Employee not found'));

      expect(mockPrismaService.department.findUnique).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when department does not exist', async () => {
      mockPrismaService.employee.findUnique.mockResolvedValue(mockEmployee);
      mockPrismaService.department.findUnique.mockResolvedValue(null);

      await expect(
        service.assignDepartment(EMPLOYEE_ID, 'non-existent-dept'),
      ).rejects.toThrow(new NotFoundException('Department not found'));

      expect(mockPrismaService.employee.update).not.toHaveBeenCalled();
    });

    it('should update departmentId and return the employee', async () => {
      const updatedEmployee = { ...mockEmployee, departmentId: DEPT_ID };

      mockPrismaService.employee.findUnique.mockResolvedValue(mockEmployee);
      mockPrismaService.department.findUnique.mockResolvedValue(mockDepartment);
      mockPrismaService.employee.update.mockResolvedValue(updatedEmployee);

      const result = await service.assignDepartment(EMPLOYEE_ID, DEPT_ID);

      expect(mockPrismaService.employee.update).toHaveBeenCalledWith({
        where: { id: EMPLOYEE_ID },
        data: { departmentId: DEPT_ID },
        include: {
          user: { select: { id: true, email: true, role: true } },
          department: true,
        },
      });
      expect(result).toEqual(updatedEmployee);
    });
  });

  // =========================================================================
  // removeDepartment
  // =========================================================================

  describe('removeDepartment', () => {
    it('should throw NotFoundException when employee does not exist', async () => {
      mockPrismaService.employee.findUnique.mockResolvedValue(null);

      await expect(service.removeDepartment('non-existent-id')).rejects.toThrow(
        new NotFoundException('Employee not found'),
      );
    });

    it('should set departmentId to null and return the updated employee', async () => {
      const updatedEmployee = { ...mockEmployee, departmentId: null };

      mockPrismaService.employee.findUnique.mockResolvedValue(mockEmployee);
      mockPrismaService.employee.update.mockResolvedValue(updatedEmployee);

      const result = await service.removeDepartment(EMPLOYEE_ID);

      expect(mockPrismaService.employee.update).toHaveBeenCalledWith({
        where: { id: EMPLOYEE_ID },
        data: { departmentId: null },
        include: {
          user: { select: { id: true, email: true, role: true } },
          department: true,
        },
      });
      expect(result.departmentId).toBeNull();
    });
  });

  // =========================================================================
  // getStatistics
  // =========================================================================

  describe('getStatistics', () => {
    it('should return employee statistics with correct shape', async () => {
      mockPrismaService.employee.count
        .mockResolvedValueOnce(100) // totalEmployees
        .mockResolvedValueOnce(80);  // activeEmployees
      mockPrismaService.department.count.mockResolvedValue(5);
      mockPrismaService.employee.aggregate.mockResolvedValue({
        _avg: { salary: 72000 },
      });

      const result = await service.getStatistics();

      expect(result).toEqual({
        totalEmployees: 100,
        activeEmployees: 80,
        inactiveEmployees: 20,
        departmentCount: 5,
        averageSalary: 72000,
      });
    });

    it('should return 0 for averageSalary when aggregate returns null', async () => {
      mockPrismaService.employee.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      mockPrismaService.department.count.mockResolvedValue(0);
      mockPrismaService.employee.aggregate.mockResolvedValue({
        _avg: { salary: null },
      });

      const result = await service.getStatistics();

      expect(result.averageSalary).toBe(0);
    });
  });

  // =========================================================================
  // search
  // =========================================================================

  describe('search', () => {
    it('should return employees matching the search query', async () => {
      const matchingEmployees = [mockEmployee];
      mockPrismaService.employee.findMany.mockResolvedValue(matchingEmployees);

      const result = await service.search('john');

      expect(mockPrismaService.employee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: expect.arrayContaining([
              { firstName: { contains: 'john', mode: 'insensitive' } },
              { lastName: { contains: 'john', mode: 'insensitive' } },
            ]),
          },
          take: 10,
        }),
      );
      expect(result).toEqual(matchingEmployees);
    });

    it('should respect the custom limit parameter', async () => {
      mockPrismaService.employee.findMany.mockResolvedValue([]);

      await service.search('test', 5);

      const callArgs = mockPrismaService.employee.findMany.mock.calls[0][0];
      expect(callArgs.take).toBe(5);
    });
  });

  // =========================================================================
  // findByUserId
  // =========================================================================

  describe('findByUserId', () => {
    it('should return the employee matching the userId', async () => {
      mockPrismaService.employee.findUnique.mockResolvedValue(mockEmployee);

      const result = await service.findByUserId(USER_ID);

      expect(mockPrismaService.employee.findUnique).toHaveBeenCalledWith({
        where: { userId: USER_ID },
        include: {
          user: { select: { id: true, email: true, role: true } },
          department: true,
        },
      });
      expect(result).toEqual(mockEmployee);
    });

    it('should throw NotFoundException when no employee matches the userId', async () => {
      mockPrismaService.employee.findUnique.mockResolvedValue(null);

      await expect(service.findByUserId('non-existent-user')).rejects.toThrow(
        new NotFoundException('Employee not found'),
      );
    });
  });
});
