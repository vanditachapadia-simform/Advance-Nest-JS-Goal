import { Logger, OnModuleInit, UseGuards } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TrackingStreamService } from '../shipments/tracking-stream.service';
import { WsJwtGuard } from '../../common/guards/ws-jwt.guard';

/**
 * Socket.IO gateway for live shipment tracking.
 *
 *  - Subscribes once to the shared TrackingStream and fans updates out to the
 *    room for each shipment (`shipment:<id>`).
 *  - Tracks connected users to expose an "online users" count.
 *  - `OnModuleInit` (LIFECYCLE HOOK) wires the stream subscription after DI is ready.
 */
@WebSocketGateway({ cors: { origin: true, credentials: true }, namespace: '/tracking' })
export class TrackingGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit
{
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(TrackingGateway.name);
  private readonly onlineUsers = new Set<string>();

  constructor(private readonly trackingStream: TrackingStreamService) {}

  onModuleInit(): void {
    // Bridge the RxJS tracking stream to Socket.IO rooms.
    this.trackingStream.asObservable().subscribe((update) => {
      this.server.to(`shipment:${update.shipmentId}`).emit('tracking:update', update);
    });
  }

  handleConnection(client: Socket): void {
    this.onlineUsers.add(client.id);
    this.logger.log(`WS connected: ${client.id} (online=${this.onlineUsers.size})`);
    this.server.emit('presence:online', { count: this.onlineUsers.size });
  }

  handleDisconnect(client: Socket): void {
    this.onlineUsers.delete(client.id);
    this.server.emit('presence:online', { count: this.onlineUsers.size });
  }

  /** Client joins the room for a shipment to receive its live updates. */
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('shipment:subscribe')
  subscribeShipment(
    @MessageBody() data: { shipmentId: string },
    @ConnectedSocket() client: Socket,
  ): { event: string; subscribed: string } {
    client.join(`shipment:${data.shipmentId}`);
    return { event: 'shipment:subscribed', subscribed: data.shipmentId };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('shipment:unsubscribe')
  unsubscribeShipment(
    @MessageBody() data: { shipmentId: string },
    @ConnectedSocket() client: Socket,
  ): void {
    client.leave(`shipment:${data.shipmentId}`);
  }

  /** Push a real-time notification to a specific user's personal room. */
  pushNotification(userId: string, payload: unknown): void {
    this.server.to(`user:${userId}`).emit('notification', payload);
  }
}
