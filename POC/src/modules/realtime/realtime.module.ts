import { Module } from '@nestjs/common';
import { TrackingGateway } from './tracking.gateway';
import { ShipmentsModule } from '../shipments/shipments.module';
import { AuthModule } from '../auth/auth.module';
import { WsJwtGuard } from '../../common/guards/ws-jwt.guard';

/**
 * Real-time module. Imports ShipmentsModule (for the TrackingStream) and
 * AuthModule (so `WsJwtGuard` can verify tokens via the exported JwtModule).
 */
@Module({
  imports: [ShipmentsModule, AuthModule],
  providers: [TrackingGateway, WsJwtGuard],
  exports: [TrackingGateway],
})
export class RealtimeModule {}
