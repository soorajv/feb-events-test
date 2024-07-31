import request from "supertest";
import { app } from "../app";
import { getDBConnection } from "../utils/getDBConnection";
import { listAvailableSeats } from "../queries/eventQueries";
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
  listAvailableSeats: jest.fn(),
}));

jest.mock("../utils/getDBConnection", () => ({
  getDBConnection: jest.fn(),
}));

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

describe("Available Seats Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/events/:eventId/seats/available", () => {
    it("returns a 200 on successful seat retrieval", async () => {
      const eventId = 1;
      const availableSeats = [
        { id: 1, seat_number: 1 },
        { id: 2, seat_number: 2 },
      ];

      (listAvailableSeats as jest.Mock).mockResolvedValueOnce(availableSeats);

      const response = await request(app)
        .get(`/api/events/${eventId}/seats/available`)
        .expect(200);

      expect(response.body).toEqual(availableSeats);
      expect(listAvailableSeats).toHaveBeenCalledTimes(1);
      expect(listAvailableSeats).toHaveBeenCalledWith(
        expect.anything(),
        eventId
      );
    });

    it("returns a 400 if the eventId is invalid", async () => {
      const invalidEventId = "invalid";

      const response = await request(app)
        .get(`/api/events/${invalidEventId}/seats/available`)
        .expect(400);

      expect(response.body).toEqual({
        message: "Invalid Event ID",
        details: ['"value" must be a number'],
      });
    });
  });
});
