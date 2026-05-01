/* Purpose: Strongly-typed notification event names to avoid free-form drift. */

export const NotificationTypes = {
  BOOKING_REQUEST: "BOOKING_REQUEST",
  BOOKING_CANCELLED: "BOOKING_CANCELLED",
  SESSION_COMPLETE: "SESSION_COMPLETE",
  TEACHER_WELCOME: "TEACHER_WELCOME",
} as const;

export type NotificationType =
  (typeof NotificationTypes)[keyof typeof NotificationTypes];

