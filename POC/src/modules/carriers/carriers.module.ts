import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CarriersService } from './carriers.service';
import { CarriersController } from './carriers.controller';
import { CarriersRepository } from './carriers.repository';
import { Carrier, CarrierSchema } from './schemas/carrier.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Carrier.name, schema: CarrierSchema }])],
  controllers: [CarriersController],
  providers: [CarriersService, CarriersRepository],
  exports: [CarriersService, CarriersRepository],
})
export class CarriersModule {}
