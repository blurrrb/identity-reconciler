import { InferModel } from "drizzle-orm";
import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  phoneNumber: text("phoneNumber"),
  email: text("email"),
  linkedId: integer("linkedId"),
  linkPrecedence: text("linkPrecedence", { enum: ["primary", "secondary"] }),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  deletedAt: timestamp("deletedAt"),
});

export type Contact = InferModel<typeof contacts>;
export type NewContact = InferModel<typeof contacts, "insert">;
