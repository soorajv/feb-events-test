import Redis from "ioredis";
import { deleteHold } from "../queries/eventQueries";
import { getDBConnection } from "../utils/getDBConnection";
import { redisConfig } from "../utils/redisConfig";

export const handleExpiration = (message: string) => {
  console.log("redis expiry event", message);

  // Check if the key is for seat hold or user event hold count
  if (message.includes("_seat_") && message.includes("_user_")) {
    const [eventPart, seatPart] = message.split("_seat_");
    const eventId = parseInt(eventPart.split("_")[1]);
    const [seatIdPart, userIdPart] = seatPart.split("_user_");
    const seatId = parseInt(seatIdPart);
    const userId = userIdPart.split("_hold")[0];

    getDBConnection()
      .then((client) => {
        client
          .query("BEGIN")
          .then(() => deleteHold(client, seatId))
          .then(() => {
            const redis = new Redis(redisConfig);
            const userEventHoldsKey = `event_${eventId}_user_${userId}_holds_count`;
            return redis.decr(userEventHoldsKey);
          })
          .then(() => client.query("COMMIT"))
          .catch((error) => {
            console.error("Error handling expiration", error);
            return client.query("ROLLBACK");
          })
          .finally(() => {
            client.release();
          });
      })
      .catch((error) => {
        console.error("Failed to connect to database", error);
      });
  } else {
    console.error("Unknown expiration key format:", message);
  }
};
