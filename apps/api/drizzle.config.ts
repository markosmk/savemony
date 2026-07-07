import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/db/schemas/index.ts",
  out: "./migrations",
  driver: "d1-http",
  // dbCredentials: {
  //   accountId: process.env.CF_ACCOUNT_ID!,
  //   databaseId: process.env.CF_DATABASE_ID!,
  //   token: process.env.CF_API_TOKEN!,
  // },
});
