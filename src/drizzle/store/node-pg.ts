import { NodePgDatabase, drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";

export async function NewNodePostgress(
  databaseUrl: string
): Promise<NodePgDatabase> {
  const client = new Client({ connectionString: databaseUrl, ssl: true });
  await client.connect();

  return drizzle(client);
}
