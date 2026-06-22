import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TasksService } from './tasks.service';
import { Shipment, ShipmentSchema } from '../../modules/shipments/schemas/shipment.schema';
import { AuditLog, AuditLogSchema } from '../../modules/audit/schemas/audit-log.schema';

/**
 * Wires the scheduled-task service. `ScheduleModule.forRoot()` is registered
 * once globally in AppModule; this module supplies the cron handlers and the
 * models they operate on.
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Shipment.name, schema: ShipmentSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),
  ],
  providers: [TasksService],
})
export class TasksModule {}
