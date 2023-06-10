import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

import config from "../../drizzle.config";
import { exit } from "process";

if (!config.connectionString) {
  throw new Error("DATABASE_URL not defined");
}

const sql = postgres(config.connectionString, { max: 1 });
const db = drizzle(sql);

(async () => {
  await migrate(db, { migrationsFolder: config.out });
  exit(0);
})();
