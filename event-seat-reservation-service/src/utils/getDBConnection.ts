import { postgresConnector } from "./db";
import { PoolClient } from "pg";

export async function getDBConnection(): Promise<PoolClient> {
  const dbInstance = postgresConnector.getInstance();
  return await dbInstance.getClient();
}
