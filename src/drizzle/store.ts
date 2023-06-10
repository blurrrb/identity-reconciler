import { Pool } from "@neondatabase/serverless";
import { NeonDatabase, drizzle } from "drizzle-orm/neon-serverless";

export function NewPostgresStore(databaseUrl: string): NeonDatabase {
  const pool = new Pool({ connectionString: databaseUrl });
  return drizzle(pool);
}
