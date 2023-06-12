import { Client } from "@neondatabase/serverless";
import { NeonDatabase, drizzle } from "drizzle-orm/neon-serverless";

export async function NewNeonPostgres(
  databaseUrl: string
): Promise<NeonDatabase> {
  const pool = new Client({ connectionString: databaseUrl });
  return drizzle(pool);
}
