import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { FilterEmployeeDto } from './dto/filter-employee.dto';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class EmployeeService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new employee
   */
  async create(createEmployeeDto: CreateEmployeeDto) {
    return this.prisma.employee.create({
      data: createEmployeeDto,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
        department: true,
      },
    });
  }

  /**
   * Get all employees with advanced filtering, sorting, and pagination
   */
  async findAll(filterDto: FilterEmployeeDto) {
    const {
      page = 1,
      limit = 10,
      search,
      departmentId,
      employmentStatus,
      position,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filterDto;

    // Build where clause
    const where: Prisma.EmployeeWhereInput = {};

    // Search across multiple fields
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { position: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Filter by department
    if (departmentId) {
      where.departmentId = departmentId;
    }

    // Filter by employment status
    if (employmentStatus) {
      where.employmentStatus = employmentStatus;
    }

    // Filter by position
    if (position) {
      where.position = { contains: position, mode: 'insensitive' };
    }

    // Build orderBy clause
    const orderBy: any = {};
    if (sortBy === 'name') {
      orderBy.lastName = sortOrder;
    } else if (sortBy === 'department') {
      orderBy.department = { name: sortOrder };
    } else {
      orderBy[sortBy] = sortOrder;
    }

    // Execute queries
    const [employees, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
              isActive: true,
            },
          },
          department: {
            select: {
              id: true,
              name: true,
              location: true,
            },
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.employee.count({ where }),
    ]);

    return new PaginatedResponseDto(employees, total, page, limit);
  }

  /**
   * Get employee by ID
   */
  async findOne(id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
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

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    return employee;
  }

  /**
   * Get employee by user ID
   */
  async findByUserId(userId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
        department: true,
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    return employee;
  }

  /**
   * Update employee
   */
  async update(id: string, updateEmployeeDto: UpdateEmployeeDto) {
    await this.findOne(id);

    return this.prisma.employee.update({
      where: { id },
      data: updateEmployeeDto,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
        department: true,
      },
    });
  }

  /**
   * Assign employee to department
   */
  async assignDepartment(employeeId: string, departmentId: string) {
    await this.findOne(employeeId);

    // Verify department exists
    const department = await this.prisma.department.findUnique({
      where: { id: departmentId },
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    return this.prisma.employee.update({
      where: { id: employeeId },
      data: { departmentId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
        department: true,
      },
    });
  }

  /**
   * Remove employee from department
   */
  async removeDepartment(employeeId: string) {
    await this.findOne(employeeId);

    return this.prisma.employee.update({
      where: { id: employeeId },
      data: { departmentId: null },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
        department: true,
      },
    });
  }

  /**
   * Delete employee
   */
  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.employee.delete({
      where: { id },
    });

    return { message: 'Employee deleted successfully' };
  }

  /**
   * Get employee statistics
   */
  async getStatistics() {
    const [
      totalEmployees,
      activeEmployees,
      departmentCount,
      averageSalary,
    ] = await Promise.all([
      this.prisma.employee.count(),
      this.prisma.employee.count({
        where: { employmentStatus: 'ACTIVE' },
      }),
      this.prisma.department.count({
        where: { isActive: true },
      }),
      this.prisma.employee.aggregate({
        _avg: {
          salary: true,
        },
      }),
    ]);

    return {
      totalEmployees,
      activeEmployees,
      inactiveEmployees: totalEmployees - activeEmployees,
      departmentCount,
      averageSalary: averageSalary._avg.salary || 0,
    };
  }

  /**
   * Assign a manager to an employee
   */
  async assignManager(employeeId: string, managerId: string) {
    if (employeeId === managerId) {
      throw new BadRequestException('An employee cannot be their own manager');
    }

    await this.findOne(employeeId);

    const manager = await this.prisma.employee.findUnique({
      where: { id: managerId },
      include: { user: { select: { role: true } } },
    });

    if (!manager) {
      throw new NotFoundException('Manager employee not found');
    }

    return this.prisma.employee.update({
      where: { id: employeeId },
      data: { managerId },
      include: {
        user: { select: { id: true, email: true, role: true } },
        department: true,
        manager: {
          include: { user: { select: { id: true, email: true, role: true } } },
        },
      },
    });
  }

  /**
   * Remove manager from an employee
   */
  async removeManager(employeeId: string) {
    await this.findOne(employeeId);

    return this.prisma.employee.update({
      where: { id: employeeId },
      data: { managerId: null },
      include: {
        user: { select: { id: true, email: true, role: true } },
        department: true,
      },
    });
  }

  /**
   * Get direct reports of a manager employee
   */
  async getDirectReports(managerId: string) {
    await this.findOne(managerId);

    return this.prisma.employee.findMany({
      where: { managerId },
      include: {
        user: { select: { id: true, email: true, role: true, isActive: true } },
        department: { select: { id: true, name: true, location: true } },
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });
  }

  /**
   * Get the manager of an employee
   */
  async getManager(employeeId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        manager: {
          include: {
            user: { select: { id: true, email: true, role: true, isActive: true } },
            department: { select: { id: true, name: true, location: true } },
          },
        },
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    return employee.manager ?? null;
  }

  /**
   * Search employees by name or email
   */
  async search(query: string, limit = 10) {
    return this.prisma.employee.findMany({
      where: {
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { user: { email: { contains: query, mode: 'insensitive' } } },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      take: limit,
    });
  }
}
