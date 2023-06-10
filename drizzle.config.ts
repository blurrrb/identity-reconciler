import type { Config } from "drizzle-kit";

export default {
  schema: "./src/drizzle/schema.ts",
  out: "./migrations",
  connectionString: process.env.DATABASE_URL,
} satisfies Config;
