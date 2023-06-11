import { Client, Pool } from "@neondatabase/serverless";
import { NeonDatabase, drizzle } from "drizzle-orm/neon-serverless";
import { NodePgDatabase } from "drizzle-orm/node-postgres";

export type DB = NeonDatabase | NodePgDatabase;

export async function NewNeonPostgres(
  databaseUrl: string
): Promise<NeonDatabase> {
  const pool = new Pool({ connectionString: databaseUrl });
  return drizzle(pool);
}

export async function NewNodePostgress(
  databaseUrl: string
): Promise<NodePgDatabase> {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  return drizzle(client);
}
