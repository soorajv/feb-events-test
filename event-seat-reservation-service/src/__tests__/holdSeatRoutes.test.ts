import request from "supertest";
import { app } from "../app";
import { holdSeat } from "../queries/eventQueries";

// Mocking ioredis
jest.mock("ioredis", () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn(),
    del: jest.fn(),
  }));
});

// Mocking database queries
jest.mock("../queries/eventQueries", () => ({
  insertEvent: jest.fn(),
  insertSeats: jest.fn(),
  holdSeat: jest.fn(),
  listAvailableSeats: jest.fn(),
  reserveSeat: jest.fn(),
  deleteHold: jest.fn(),
  updateHold: jest.fn(),
}));

jest.mock("../utils/getDBConnection", () => ({
  getDBConnection: jest.fn(),
}));

const mockQuery = jest.fn();
const mockBegin = jest.fn();
const mockCommit = jest.fn();
const mockRollback = jest.fn();
const mockRelease = jest.fn();

import { getDBConnection } from "../utils/getDBConnection";
(getDBConnection as jest.Mock).mockImplementation(() => ({
  query: mockQuery,
  begin: mockBegin,
  commit: mockCommit,
  rollback: mockRollback,
  release: mockRelease,
}));

describe("Seat Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /events/:eventId/seats/:seatId/hold", () => {
    it("returns a 200 on successful seat hold", async () => {
      const eventId = 1;
      const seatId = 2;
      const userId = "8d660641-b323-482a-971d-ade9cc4e90de";

      (holdSeat as jest.Mock).mockResolvedValueOnce({ id: seatId });

      const response = await request(app)
        .post(`/api/events/${eventId}/seats/${seatId}/hold`)
        .send({ userId })
        .expect(200);

      expect(response.body).toEqual({
        message: "Seat held successfully",
        seatId: seatId.toString(),
        userId: userId,
        result: { id: seatId },
      });

      expect(holdSeat).toHaveBeenCalledTimes(1);
    });

    it("returns a 400 if the provided data does not exist", async () => {
      const eventId = 1;
      const seatId = 2;
      const userId = "8d660641-b323-482a-971d-ade9cc4e90de";

      const error: any = new Error("The provided data does not exist");
      error.code = "23503"; // Simulating a PostgreSQL foreign key violation
      (holdSeat as jest.Mock).mockRejectedValue(error);

      const response = await request(app)
        .post(`/api/events/${eventId}/seats/${seatId}/hold`)
        .send({ userId })
        .expect(400);

      expect(response.body).toEqual({
        message: "The provided data not exists in the system.",
      });

      expect(holdSeat).toHaveBeenCalledTimes(1);
    });

    it("handles unexpected errors during seat hold", async () => {
      const eventId = 1;
      const seatId = 2;
      const userId = "8d660641-b323-482a-971d-ade9cc4e90de";

      (holdSeat as jest.Mock).mockRejectedValue(new Error("Unexpected error"));

      const response = await request(app)
        .post(`/api/events/${eventId}/seats/${seatId}/hold`)
        .send({ userId })
        .expect(500);

      expect(response.body).toEqual({
        message: "Failed to hold seat",
        error: "Unexpected error",
      });

      expect(holdSeat).toHaveBeenCalledTimes(1);
    });
  });
});
