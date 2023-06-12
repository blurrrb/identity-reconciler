import { describe, expect, it } from "vitest";
import { contacts } from "../../src/drizzle/schema";
import { NewNodePostgress } from "../../src/drizzle/store/node-pg";

describe("db", async () => {
  const DATABASE_URL: string | undefined = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    throw new Error(
      "DATABASE_URL not defined, not able to perform integration tests on db"
    );
  }

  const db = await NewNodePostgress(DATABASE_URL);
  it("should return all values", async () => {
    const fetchedContacts = await db.select().from(contacts);
    console.log(fetchedContacts);
    expect(1).toBe(1);
  });
});
