import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CarriersRepository } from './carriers.repository';
import { CreateCarrierDto } from './dto/create-carrier.dto';
import { UpdateCarrierDto } from './dto/update-carrier.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
import { ResourceNotFoundException } from '../../common/exceptions/business.exception';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { EVENTS } from '../../shared/constants';
import { CarrierCreatedEvent } from '../../events/event-payloads';
import { Carrier, CarrierDocument } from './schemas/carrier.schema';

@Injectable()
export class CarriersService {
  private readonly cachePrefix = 'carrier';

  constructor(
    private readonly carriersRepository: CarriersRepository,
    private readonly eventEmitter: EventEmitter2,
    @Inject(RedisService) private readonly redis: RedisService,
  ) {}

  async create(dto: CreateCarrierDto): Promise<Carrier> {
    const carrier = (await this.carriersRepository.create(dto)) as CarrierDocument;
    this.eventEmitter.emit(EVENTS.CARRIER_CREATED, new CarrierCreatedEvent(carrier.id, carrier.name));
    return carrier;
  }

  async findAll(pagination: PaginationDto): Promise<PaginatedResult<Carrier>> {
    const { items, total } = await this.carriersRepository.paginate(
      {},
      { skip: pagination.skip, limit: pagination.limit, sort: { createdAt: -1 } },
    );
    return PaginatedResult.build(items, total, pagination.page, pagination.limit);
  }

  async findById(id: string): Promise<Carrier> {
    const carrier = await this.carriersRepository.findById(id);
    if (!carrier) throw new ResourceNotFoundException('Carrier', id);
    return carrier;
  }

  async update(id: string, dto: UpdateCarrierDto): Promise<Carrier> {
    const carrier = await this.carriersRepository.update(id, dto);
    if (!carrier) throw new ResourceNotFoundException('Carrier', id);
    // Bust any cached representation of this carrier.
    await this.redis.delByPattern(`${this.cachePrefix}:*`);
    return carrier;
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.carriersRepository.delete(id);
    if (!deleted) throw new ResourceNotFoundException('Carrier', id);
    await this.redis.delByPattern(`${this.cachePrefix}:*`);
  }
}
