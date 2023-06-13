import { NeonDatabase } from "drizzle-orm/neon-serverless";
import { NodePgDatabase } from "drizzle-orm/node-postgres";

export type DB = NeonDatabase | NodePgDatabase;
