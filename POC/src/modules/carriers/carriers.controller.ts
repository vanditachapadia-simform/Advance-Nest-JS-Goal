import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CarriersService } from './carriers.service';
import { CreateCarrierDto } from './dto/create-carrier.dto';
import { UpdateCarrierDto } from './dto/update-carrier.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Audit } from '../../common/decorators/audit.decorator';
import { Cacheable } from '../../common/decorators/cache.decorator';
import { HttpCacheInterceptor } from '../../common/interceptors/http-cache.interceptor';
import { Role } from '../../shared/enums';

@ApiTags('Carriers')
@ApiBearerAuth()
@Controller({ path: 'carriers', version: '1' })
export class CarriersController {
  constructor(private readonly carriersService: CarriersService) {}

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER)
  @Audit({ action: 'CREATE', entity: 'Carrier' })
  @ApiOperation({ summary: 'Register a carrier' })
  create(@Body() dto: CreateCarrierDto) {
    return this.carriersService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List carriers (paginated)' })
  findAll(@Query() pagination: PaginationDto) {
    return this.carriersService.findAll(pagination);
  }

  @Get(':id')
  // Cached read-through via Redis for 120s (see HttpCacheInterceptor).
  @UseInterceptors(HttpCacheInterceptor)
  @Cacheable('carrier', 120)
  @ApiOperation({ summary: 'Get a carrier by id (cached)' })
  findOne(@Param('id') id: string) {
    return this.carriersService.findById(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @Audit({ action: 'UPDATE', entity: 'Carrier' })
  @ApiOperation({ summary: 'Update a carrier' })
  update(@Param('id') id: string, @Body() dto: UpdateCarrierDto) {
    return this.carriersService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @Audit({ action: 'DELETE', entity: 'Carrier' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a carrier (admin only)' })
  remove(@Param('id') id: string) {
    return this.carriersService.remove(id);
  }
}
