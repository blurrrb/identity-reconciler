import { InferModel } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const contacts = pgTable(
  "contacts",
  {
    id: serial("id").primaryKey(),
    phoneNumber: text("phone_number"),
    email: text("email"),
    linkedId: integer("linked_id"),
    linkPrecedence: text("link_precedence", {
      enum: ["primary", "secondary"],
    }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => ({
    nameIdx: index("email_idx").on(table.email).concurrently(),
    emailIdx: index("phone_number_idx").on(table.phoneNumber).concurrently(),
    linkedIdIdx: index("linked_id_idx").on(table.linkedId).concurrently(),
  })
);

export type Contact = InferModel<typeof contacts>;
export type NewContact = InferModel<typeof contacts, "insert">;
