import { Pool, PoolClient } from "pg";
import { dbConfig } from "./dbConfig";
import { DatabaseConfig } from "./types";

class Db {
  private static instance: Db;
  public pool: Pool;

  private constructor(config: DatabaseConfig) {
    this.pool = new Pool(config);
    this.pool.on("error", (err) => {
      console.error("Unexpected error on idle client", err);
      process.exit(-1);
    });
  }

  public static getInstance(config: DatabaseConfig = dbConfig): Db {
    if (!Db.instance) {
      Db.instance = new Db(config);
    }
    return Db.instance;
  }

  // for transactions or when need a specific client
  public async getClient(): Promise<PoolClient> {
    const client = await this.pool.connect();
    return client;
  }

  // For simple queries no need unnecessary client checkout
  public query(query: string, params?: any[]): Promise<any> {
    return this.pool.query(query, params);
  }

  public async end(): Promise<void> {
    await this.pool.end();
  }
}

export const postgresConnector = Object.freeze({
  getInstance: Db.getInstance,
});
