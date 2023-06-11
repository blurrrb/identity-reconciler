import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Client } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

import config from "../../drizzle.config";

if (!config.connectionString) {
  throw new Error("DATABASE_URL not defined");
}

(async () => {
  const client = new Client({ connectionString: config.connectionString });
  await client.connect();

  const db = drizzle(client);

  await migrate(db, { migrationsFolder: config.out });
  console.log("done migrating");

  await client.end();
})();
