import { Injectable } from '@nestjs/common';
import { filter, Observable, Subject } from 'rxjs';

export interface TrackingUpdate {
  shipmentId: string;
  shipmentNumber: string;
  status: string;
  description?: string;
  location?: string;
  lat?: number;
  lng?: number;
  timestamp: string;
}

/**
 * In-memory pub/sub hub for live tracking updates.
 *
 * Shipment status changes are published here; both the SSE endpoint and the
 * WebSocket gateway subscribe. A single shared `Subject` decouples producers
 * (ShipmentService) from consumers (SSE/WS) — they never reference each other.
 *
 * (In a multi-instance deployment this would be backed by Redis pub/sub so
 * updates fan out across nodes; the interface stays identical.)
 */
@Injectable()
export class TrackingStreamService {
  private readonly subject = new Subject<TrackingUpdate>();

  publish(update: TrackingUpdate): void {
    this.subject.next(update);
  }

  /** Stream of all updates. */
  asObservable(): Observable<TrackingUpdate> {
    return this.subject.asObservable();
  }

  /** Stream scoped to a single shipment (used by the SSE endpoint). */
  forShipment(shipmentId: string): Observable<TrackingUpdate> {
    return this.subject.asObservable().pipe(filter((u) => u.shipmentId === shipmentId));
  }
}
