import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { ShipmentsModule } from '../shipments/shipments.module';
import { Carrier, CarrierSchema } from '../carriers/schemas/carrier.schema';
import { User, UserSchema } from '../users/schemas/user.schema';

@Module({
  imports: [
    ShipmentsModule,
    MongooseModule.forFeature([
      { name: Carrier.name, schema: CarrierSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
