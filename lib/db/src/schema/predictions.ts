import { pgTable, serial, text, real, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const predictionsTable = pgTable("predictions", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  predictedClass: text("predicted_class").notNull(),
  confidence: real("confidence").notNull(),
  inputFeatures: jsonb("input_features"),
  timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow().notNull(),
});

export const insertPredictionSchema = createInsertSchema(predictionsTable).omit({ id: true, timestamp: true });
export type InsertPrediction = z.infer<typeof insertPredictionSchema>;
export type Prediction = typeof predictionsTable.$inferSelect;
