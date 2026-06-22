import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../database/base.repository';
import { Shipment } from './schemas/shipment.schema';

@Injectable()
export class ShipmentsRepository extends BaseRepository<Shipment> {
  constructor(@InjectModel(Shipment.name) private readonly shipmentModel: Model<Shipment>) {
    super(shipmentModel);
  }

  /** Aggregated count grouped by status — feeds the analytics dashboard. */
  countByStatus(): Promise<{ _id: string; count: number }[]> {
    return this.shipmentModel
      .aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }])
      .exec();
  }
}
