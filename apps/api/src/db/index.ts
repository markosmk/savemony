import { type DrizzleD1Database, drizzle } from "drizzle-orm/d1";

import * as schema from "./schemas";

export type DB = DrizzleD1Database<typeof schema>;

// createClient
export const getDB = (d1: D1Database) => {
  return drizzle(d1, { schema });
};
