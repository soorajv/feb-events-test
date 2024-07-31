import request from "supertest";
import { app } from "../app";
import { reserveSeat, deleteHold } from "../queries/eventQueries";
import Redis from "ioredis";
import { getDBConnection } from "../utils/getDBConnection";

jest.mock("ioredis");
jest.mock("../queries/eventQueries");
jest.mock("../utils/getDBConnection");

const mockQuery = jest.fn();
const mockBegin = jest.fn();
const mockCommit = jest.fn();
const mockRollback = jest.fn();
const mockRelease = jest.fn();

(getDBConnection as jest.Mock).mockImplementation(() => ({
  query: mockQuery,
  begin: mockBegin,
  commit: mockCommit,
  rollback: mockRollback,
  release: mockRelease,
}));

describe("Reservation Routes", () => {
  const eventId = 1;
  const seatId = 1;
  const userId = "8d660641-b323-482a-971d-ade9cc4e90de";
  const seatHoldKey = `event_${eventId}_seat_${seatId}_user_${userId}_hold`;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /events/:eventId/seats/:seatId/reserve", () => {
    it("returns a 200 on successful seat reservation", async () => {
      (Redis.prototype.get as jest.Mock).mockResolvedValue(userId);
      (reserveSeat as jest.Mock).mockResolvedValue([{ id: 1 }]);
      (deleteHold as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .post(`/api/events/${eventId}/seats/${seatId}/reserve`)
        .send({ userId })
        .expect(200);

      expect(response.body).toEqual({
        message: "Seat reserved successfully",
        eventId: eventId.toString(),
        seatId: seatId.toString(),
        userId,
        result: { id: 1 },
      });

      expect(Redis.prototype.get).toHaveBeenCalledWith(seatHoldKey);
      expect(reserveSeat).toHaveBeenCalledTimes(1);
      expect(deleteHold).toHaveBeenCalledTimes(1);
    });

    it("returns a 400 if the provided data does not exist", async () => {
      const error: any = new Error(
        "The provided data not exists in the system."
      );
      error.code = "23503"; // Simulating a PostgreSQL foreign key violation
      (reserveSeat as jest.Mock).mockRejectedValue(error);

      const response = await request(app)
        .post(`/api/events/${eventId}/seats/${seatId}/reserve`)
        .send({ userId })
        .expect(400);

      expect(response.body).toEqual({
        message: "The provided data not exists in the system.",
      });
    });

    it("returns a 500 if no valid hold found", async () => {
      (Redis.prototype.get as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post(`/api/events/${eventId}/seats/${seatId}/reserve`)
        .send({ userId })
        .expect(500);

      expect(response.body).toEqual({
        message: "Failed to reserve seat",
        error: "No valid hold found for this seat and user.",
      });
    });

    it("handles unexpected errors during seat reservation", async () => {
      const error: any = new Error(
        "No valid hold found for this seat and user."
      );
      (reserveSeat as jest.Mock).mockRejectedValue(error);

      const response = await request(app)
        .post(`/api/events/${eventId}/seats/${seatId}/reserve`)
        .send({ userId })
        .expect(500);

      expect(response.body).toEqual({
        message: "Failed to reserve seat",
        error: "No valid hold found for this seat and user.",
      });
    });
  });
});
