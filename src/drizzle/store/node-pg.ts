import { NodePgDatabase, drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

export async function NewNodePostgress(
  databaseUrl: string,
  ssl = true
): Promise<NodePgDatabase> {
  const client = new Pool({ connectionString: databaseUrl, ssl });
  await client.connect();

  return drizzle(client);
}
