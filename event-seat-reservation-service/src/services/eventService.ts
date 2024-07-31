import Redis from "ioredis";
import {
  insertEvent,
  insertSeats,
  holdSeat,
  listAvailableSeats,
  reserveSeat,
  deleteHold,
  updateHold,
} from "../queries/eventQueries";
import { getDBConnection } from "../utils/getDBConnection";
import { redisConfig } from "../utils/redisConfig";
const redis = new Redis(redisConfig);
const holdDurationInSeconds = process.env.DEFAULT_HOLD_DURATION || "60"; // Default to 60 seconds
const maxSeatsPerUser = process.env.MAX_SEATS_PER_USER || "3";
export class EventService {
  // Create an event
  async createEvent(name: string, totalSeats: number): Promise<number> {
    const client = await getDBConnection();
    try {
      await client.query("BEGIN");
      const eventId = await insertEvent(client, name, totalSeats); // Insert event and get ID
      await insertSeats(client, eventId, totalSeats);
      await client.query("COMMIT");
      return eventId;
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error creating event", error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Hold a seat
  async holdSeat(
    eventId: number,
    seatId: number,
    userId: string
  ): Promise<any> {
    const client = await getDBConnection();
    const seatHoldKey = `event_${eventId}_seat_${seatId}_user_${userId}_hold`;

    try {
      const isHeld = await redis.get(seatHoldKey);
      if (isHeld) {
        throw new Error("Seat is currently held");
      }
      // Check and update the count of holds by the user for this event
      const userEventHoldsKey = `event_${eventId}_user_${userId}_holds_count`;
      const currentHolds = await redis.get(userEventHoldsKey);
      const currentHoldsCount = currentHolds ? parseInt(currentHolds) : 0;
      if (currentHoldsCount >= parseInt(maxSeatsPerUser)) {
        throw new Error(
          "Maximum number of holds reached for this user at this event"
        );
      }
      await client.query("BEGIN");
      const holdResult = await holdSeat(
        client,
        eventId,
        seatId,
        userId,
        parseInt(holdDurationInSeconds)
      );
      await client.query("COMMIT");
      // Update the Redis counter after the database transaction is successful
      await redis.incr(userEventHoldsKey);
      await redis.expire(
        userEventHoldsKey,
        parseInt(holdDurationInSeconds) * 2
      ); // Ensure cleanup
      await redis.set(
        seatHoldKey,
        userId,
        "EX",
        parseInt(holdDurationInSeconds)
      ); // Set hold in Redis

      return holdResult;
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error holding seat", error);
      throw error;
    } finally {
      client.release();
    }
  }
  async listAvailableSeats(eventId: number): Promise<any[]> {
    const client = await getDBConnection();
    try {
      const availableSeats = await listAvailableSeats(client, eventId);
      return availableSeats;
    } catch (error) {
      console.error("Error listing available seats", error);
      throw error;
    } finally {
      client.release();
    }
  }
  async reserveSeat(
    eventId: number,
    seatId: number,
    userId: string
  ): Promise<any> {
    const client = await getDBConnection();
    const seatHoldKey = `event_${eventId}_seat_${seatId}_user_${userId}_hold`;
    const userEventHoldsKey = `event_${eventId}_user_${userId}_holds_count`;
    try {
      // Check for an active hold in Redis
      const holdUser = await redis.get(seatHoldKey);
      if (!holdUser || holdUser !== userId) {
        throw new Error("No valid hold found for this seat and user.");
      }

      await client.query("BEGIN");

      // Proceed with reservation because Redis confirms the hold
      const reservationResult = await reserveSeat(client, seatId, userId);
      if (reservationResult.length === 0) {
        throw new Error("Reservation failed or seat is not held by the user");
      }
      await deleteHold(client, seatId);
      await client.query("COMMIT");
      await redis.del(seatHoldKey);
      // Decrement the user's hold count only after successful commit
      await redis.decr(userEventHoldsKey);
      return reservationResult[0]; // Return the reservation details
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error reserving seat", error);
      throw error;
    } finally {
      client.release();
    }
  }

  async refreshHold(eventId: number, seatId: number, userId: string) {
    const client = await getDBConnection();
    const seatHoldKey = `event_${eventId}_seat_${seatId}_user_${userId}_hold`;
    const userEventHoldsKey = `event_${eventId}_user_${userId}_holds_count`;

    try {
      const isHeld = await redis.get(seatHoldKey);
      if (!isHeld || isHeld !== userId) {
        throw new Error("No valid hold found or hold belongs to another user");
      }

      await client.query("BEGIN");
      const refreshResult = await updateHold(
        client,
        seatId,
        userId,
        parseInt(holdDurationInSeconds)
      );
      if (refreshResult) {
        await client.query("COMMIT");
        // Reset the expiration for the specific seat hold
        await redis.set(
          seatHoldKey,
          userId,
          "EX",
          parseInt(holdDurationInSeconds)
        );
        // Reset the expiration for the count of holds by this user for this event
        await redis.expire(
          userEventHoldsKey,
          parseInt(holdDurationInSeconds) * 2
        );
      } else {
        await client.query("ROLLBACK");
        throw new Error("Failed to refresh the hold on the seat");
      }

      return refreshResult;
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error refreshing hold on seat", error);
      throw error;
    } finally {
      client.release();
    }
  }
}
