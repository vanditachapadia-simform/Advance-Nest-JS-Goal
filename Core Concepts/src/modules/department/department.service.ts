import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';

@Injectable()
export class DepartmentService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new department
   */
  async create(createDepartmentDto: CreateDepartmentDto) {
    // Check if department with same name exists
    const existing = await this.prisma.department.findUnique({
      where: { name: createDepartmentDto.name },
    });

    if (existing) {
      throw new ConflictException(
        'Department with this name already exists',
      );
    }

    return this.prisma.department.create({
      data: createDepartmentDto,
    });
  }

  /**
   * Get all departments with pagination
   */
  async findAll(paginationDto: PaginationDto, includeInactive = false) {
    const { page = 1, limit = 10 } = paginationDto;

    const where = includeInactive ? {} : { isActive: true };

    const [departments, total] = await Promise.all([
      this.prisma.department.findMany({
        where,
        include: {
          _count: {
            select: { employees: true },
          },
        },
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.department.count({ where }),
    ]);

    return new PaginatedResponseDto(departments, total, page, limit);
  }

  /**
   * Get all departments without pagination (for dropdowns)
   */
  async findAllSimple() {
    return this.prisma.department.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        location: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get department by ID
   */
  async findOne(id: string) {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: {
        employees: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true,
            employmentStatus: true,
          },
          orderBy: { lastName: 'asc' },
        },
        _count: {
          select: { employees: true },
        },
      },
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    return department;
  }

  /**
   * Update department
   */
  async update(id: string, updateDepartmentDto: UpdateDepartmentDto) {
    await this.findOne(id);

    // Check if new name conflicts with existing department
    if (updateDepartmentDto.name) {
      const existing = await this.prisma.department.findUnique({
        where: { name: updateDepartmentDto.name },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException(
          'Department with this name already exists',
        );
      }
    }

    return this.prisma.department.update({
      where: { id },
      data: updateDepartmentDto,
      include: {
        _count: {
          select: { employees: true },
        },
      },
    });
  }

  /**
   * Deactivate department
   */
  async deactivate(id: string) {
    await this.findOne(id);

    return this.prisma.department.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Delete department
   */
  async remove(id: string) {
    const department = await this.findOne(id);

    if (department._count.employees > 0) {
      throw new ConflictException(
        'Cannot delete department with assigned employees',
      );
    }

    await this.prisma.department.delete({
      where: { id },
    });

    return { message: 'Department deleted successfully' };
  }

  /**
   * Get department statistics
   */
  async getStatistics(id: string) {
    const department = await this.findOne(id);

    const [
      totalEmployees,
      activeEmployees,
      averageSalary,
    ] = await Promise.all([
      this.prisma.employee.count({
        where: { departmentId: id },
      }),
      this.prisma.employee.count({
        where: {
          departmentId: id,
          employmentStatus: 'ACTIVE',
        },
      }),
      this.prisma.employee.aggregate({
        where: { departmentId: id },
        _avg: {
          salary: true,
        },
      }),
    ]);

    return {
      department: {
        id: department.id,
        name: department.name,
      },
      statistics: {
        totalEmployees,
        activeEmployees,
        averageSalary: averageSalary._avg.salary || 0,
      },
    };
  }
}
