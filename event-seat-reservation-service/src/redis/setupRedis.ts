import Redis from "ioredis";
import { redisConfig } from "../utils/redisConfig";
import { handleExpiration } from "./handleRedisExpirationEvent";
export const setupRedis = () => {
  const redis = new Redis(redisConfig);

  redis.config("SET", "notify-keyspace-events", "Ex");
  const subscriber = new Redis(redisConfig);
  subscriber.subscribe("__keyevent@0__:expired", (err, count) => {
    if (err) {
      console.error("Failed to subscribe:", err.message);
    } else {
      console.log(
        `Subscribed to key expiration events. Listening to ${count} channels.`
      );
    }
  });

  subscriber.on("message", (_, message) => {
    console.log(`Key expired: ${message}`);
    handleExpiration(message);
  });

  // Graceful shutdown for Redis
  const gracefulShutdown = () => {
    console.log("Closing Redis connections...");
    redis.quit();
    subscriber.quit();
  };

  process.on("SIGTERM", gracefulShutdown);
  process.on("SIGINT", gracefulShutdown);
};
