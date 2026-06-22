import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ShipmentsService } from './shipments.service';
import { ShipmentsController } from './shipments.controller';
import { ShipmentsRepository } from './shipments.repository';
import { TrackingStreamService } from './tracking-stream.service';
import { Shipment, ShipmentSchema } from './schemas/shipment.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Shipment.name, schema: ShipmentSchema }])],
  controllers: [ShipmentsController],
  providers: [ShipmentsService, ShipmentsRepository, TrackingStreamService],
  // TrackingStreamService is exported so the WebSocket gateway can subscribe.
  exports: [ShipmentsService, ShipmentsRepository, TrackingStreamService],
})
export class ShipmentsModule {}
