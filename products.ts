import { pgTable, text, serial, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  barcode: text("barcode"),
  name: text("name").notNull(),
  purchasePrice: doublePrecision("purchase_price"),
  sellingPrice: doublePrecision("selling_price").notNull(),
  mrp: doublePrecision("mrp").notNull(),
  unitType: text("unit_type").notNull().default("PCS"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
