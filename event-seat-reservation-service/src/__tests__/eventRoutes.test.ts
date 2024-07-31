import request from "supertest";
import { app } from "../app";
import { insertEvent, insertSeats } from "../queries/eventQueries";
import { getDBConnection } from "../utils/getDBConnection";

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

describe("Event Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /events", () => {
    it("returns a 201 on successful event creation", async () => {
      const eventName = "New Year Celebration";
      const totalSeats = 150;

      (insertEvent as jest.Mock).mockResolvedValueOnce(1);
      (insertSeats as jest.Mock).mockResolvedValueOnce(undefined);

      const response = await request(app)
        .post("/api/events")
        .send({
          name: eventName,
          totalSeats: totalSeats,
        })
        .expect(201);

      expect(response.body).toEqual({
        eventId: 1,
        message: "Event created successfully",
      });

      expect(insertEvent).toHaveBeenCalledTimes(1);
      expect(insertSeats).toHaveBeenCalledTimes(1);
    });

    it("returns a 400 if the event name already exists", async () => {
      const eventName = "New Year Celebration";
      const totalSeats = 150;

      const error: any = new Error("Event with this name already exists");
      error.code = "23505"; // Simulating a PostgreSQL unique violation
      (insertEvent as jest.Mock).mockRejectedValue(error);

      await request(app)
        .post("/api/events")
        .send({
          name: eventName,
          totalSeats: totalSeats,
        })
        .expect(400);

      expect(insertEvent).toHaveBeenCalledTimes(1);
    });

    it("handles unexpected database errors", async () => {
      (insertEvent as jest.Mock).mockRejectedValue(new Error("Database error"));

      await request(app)
        .post("/api/events")
        .send({
          name: "Festival",
          totalSeats: 200,
        })
        .expect(500);

      expect(insertEvent).toHaveBeenCalledTimes(1);
    });
  });
});
