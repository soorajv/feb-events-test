import { DatabaseConfig } from "./types";
export const dbConfig: DatabaseConfig = {
  host: process.env.POSTGRES_HOST,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  port: process.env.POSTGRES_PORT
    ? parseInt(process.env.POSTGRES_PORT, 10)
    : undefined,
};
