import { config } from "dotenv";
import { defineConfig } from "prisma/config";

if (!process.env["DATABASE_URL"]) {
  config({ path: ".env.local" });
}
config();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
