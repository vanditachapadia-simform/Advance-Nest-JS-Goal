import { Controller, Logger } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Shipment } from '../../modules/shipments/schemas/shipment.schema';
import { PATTERNS } from '../../shared/constants';

@Controller()
export class ShipmentServiceController {
  private readonly logger = new Logger(ShipmentServiceController.name);

  constructor(@InjectModel(Shipment.name) private readonly shipmentModel: Model<Shipment>) {}

  @MessagePattern(PATTERNS.SHIPMENT_GET_SUMMARY)
  async summary() {
    const rows = await this.shipmentModel
      .aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }])
      .exec();
    return rows.reduce((acc, r) => ({ ...acc, [r._id]: r.count }), {});
  }

  @EventPattern(PATTERNS.EVENT_SHIPMENT_CREATED)
  handleShipmentCreated(@Payload() data: { shipmentNumber: string }) {
    this.logger.log(`[shipment-service] received shipment.created for ${data.shipmentNumber}`);
  }
}
