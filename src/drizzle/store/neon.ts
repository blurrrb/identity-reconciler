import { Pool } from "@neondatabase/serverless";
import { NeonDatabase, drizzle } from "drizzle-orm/neon-serverless";

export async function NewNeonPostgres(
  databaseUrl: string
): Promise<NeonDatabase> {
  const pool = new Pool({ connectionString: databaseUrl });
  return drizzle(pool);
}
