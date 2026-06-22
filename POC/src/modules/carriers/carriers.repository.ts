import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../database/base.repository';
import { Carrier } from './schemas/carrier.schema';

@Injectable()
export class CarriersRepository extends BaseRepository<Carrier> {
  constructor(@InjectModel(Carrier.name) private readonly carrierModel: Model<Carrier>) {
    super(carrierModel);
  }
}
