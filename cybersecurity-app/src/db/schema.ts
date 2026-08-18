import { char, index, pgTable, serial, timestamp, varchar, text, boolean } from "drizzle-orm/pg-core";

export const trainingEvents = pgTable(
  "training_events",
  {
    id: serial("id").primaryKey(),
    event: varchar("event", { length: 64 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    eventIdx: index("training_events_event_idx").on(table.event),
    createdAtIdx: index("training_events_created_at_idx").on(table.createdAt),
  }),
);

export const authSessions = pgTable(
  "auth_sessions",
  {
    id: serial("id").primaryKey(),
    username: varchar("username", { length: 255 }),
    email: varchar("email", { length: 255 }),
    country: varchar("country", { length: 100 }),
    city: varchar("city", { length: 100 }),
    state: varchar("state", { length: 100 }),
    ipAddress: varchar("ip_address", { length: 100 }),
    latitude: varchar("latitude", { length: 50 }),
    longitude: varchar("longitude", { length: 50 }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    rawResponse: text("raw_response"),
    sessionData: text("session_data"),
    syncedToGmail: boolean("synced_to_gmail").default(false).notNull(),
    notificationStatus: varchar("notification_status", { length: 50 }).default("PENDING"),
    notificationLog: text("notification_log"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    createdAtIdx: index("auth_sessions_created_at_idx").on(table.createdAt),
  }),
);

// Safe session diagnostics: store only a non-reversible hash, never cookies,
// passwords, MFA codes, authorization codes, or raw access/refresh tokens.
export const sessionDebug = pgTable(
  "session_debug",
  {
    id: serial("id").primaryKey(),
    userId: varchar("user_id", { length: 255 }),
    sessionHash: char("session_hash", { length: 64 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    sessionHashIdx: index("session_debug_session_hash_idx").on(table.sessionHash),
    createdAtIdx: index("session_debug_created_at_idx").on(table.createdAt),
  }),
);

export type TrainingEvent = typeof trainingEvents.$inferSelect;
export type NewTrainingEvent = typeof trainingEvents.$inferInsert;
export type AuthSession = typeof authSessions.$inferSelect;
export type NewAuthSession = typeof authSessions.$inferInsert;
export type SessionDebug = typeof sessionDebug.$inferSelect;
export type NewSessionDebug = typeof sessionDebug.$inferInsert;

// The authSessions columns above are legacy fields from the earlier project.
// Do not populate them with reusable credentials or forward them to email.
