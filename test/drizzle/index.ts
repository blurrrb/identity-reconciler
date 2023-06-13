import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import config from "../../drizzle.config";
import { NewNodePostgress } from "../../src/drizzle/store/node-pg";
import { createId } from "@paralleldrive/cuid2";

const DATABASE_URL = "postgres://postgres:postgres@localhost:5432/postgres";

let DB: NodePgDatabase;

export default async function setupAndGetDbForTesting() {
  if (DB) {
    return DB;
  }

  DB = await NewNodePostgress(DATABASE_URL, false);
  await migrate(DB, { migrationsFolder: config.out });

  return DB;
}

export function getRandomEmail() {
  return `${createId()}@testmail.com`;
}

export function getRandomPhoneNumber() {
  return `+91${createId()}`;
}
