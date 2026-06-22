import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppConfigModule } from '../../config/app-config.module';
import { DatabaseModule } from '../../database/database.module';
import { Shipment, ShipmentSchema } from '../../modules/shipments/schemas/shipment.schema';
import { ShipmentServiceController } from './shipment-service.controller';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    MongooseModule.forFeature([{ name: Shipment.name, schema: ShipmentSchema }]),
  ],
  controllers: [ShipmentServiceController],
})
export class ShipmentServiceModule {}
