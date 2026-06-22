import { SetMetadata } from '@nestjs/common';

export const AUDIT_KEY = 'audit';

export interface AuditMetadata {
  action: string;
  entity: string;
}

/**
 * Flags a handler for audit logging. The `AuditInterceptor` reads this metadata
 * and writes an AuditLog entry after the handler succeeds.
 *
 * @example  @Audit({ action: 'CREATE', entity: 'Shipment' })
 */
export const Audit = (metadata: AuditMetadata) => SetMetadata(AUDIT_KEY, metadata);
