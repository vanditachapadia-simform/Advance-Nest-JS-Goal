/** Generic account status for users. */
export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

/** Operational status for a carrier. */
export enum CarrierStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING_REVIEW = 'PENDING_REVIEW',
  BLACKLISTED = 'BLACKLISTED',
}

/** Notification delivery channels. */
export enum NotificationChannel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
  IN_APP = 'IN_APP',
}
