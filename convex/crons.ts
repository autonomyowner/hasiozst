import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Recompute content popularity scores every 15 minutes
crons.interval(
  "computePopularity",
  { minutes: 15 },
  internal.tracking.computePopularity
);

// Delete events older than 90 days — runs daily at 3:00 AM UTC
crons.daily(
  "pruneOldEvents",
  { hourUTC: 3, minuteUTC: 0 },
  internal.tracking.pruneOldEvents
);

// Re-aggregate stale user preferences every hour
crons.interval(
  "refreshStalePreferences",
  { hours: 1 },
  internal.tracking.refreshStalePreferences
);

// Sync delivery shipment statuses every 30 minutes
crons.interval(
  "syncDeliveryStatuses",
  { minutes: 30 },
  internal.delivery.syncAllActiveShipments
);

// Expire stale promotions every hour
crons.interval(
  "expireStalePromotions",
  { hours: 1 },
  internal.promotions.expireStalePromotions
);

export default crons;
