import request from "supertest";
import { app } from "../app";
import { updateHold } from "../queries/eventQueries";
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
describe("Refresh Hold Routes", () => {
  const mockQuery = jest.fn();
  const mockRelease = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (getDBConnection as jest.Mock).mockResolvedValue({
      query: mockQuery,
      release: mockRelease,
    });
  });

  const eventId = 1;
  const seatId = 1;
  const userId = "8d660641-b323-482a-971d-ade9cc4e90de";
  const holdDurationInSeconds = 60;

  it("returns a 200 on successful hold refresh", async () => {
    (Redis.prototype.get as jest.Mock).mockResolvedValue(userId);
    (updateHold as jest.Mock).mockResolvedValue({ id: 1 });

    const response = await request(app)
      .post(`/api/events/${eventId}/seats/${seatId}/hold/refresh`)
      .send({ userId })
      .expect(200);

    expect(response.body).toEqual({
      message: "Hold on seat refreshed successfully",
      details: { id: 1 },
    });

    expect(Redis.prototype.get).toHaveBeenCalledWith(
      `event_${eventId}_seat_${seatId}_user_${userId}_hold`
    );
    expect(updateHold).toHaveBeenCalledWith(
      expect.anything(),
      seatId,
      userId,
      holdDurationInSeconds
    );
    expect(Redis.prototype.set).toHaveBeenCalledWith(
      `event_${eventId}_seat_${seatId}_user_${userId}_hold`,
      userId,
      "EX",
      holdDurationInSeconds
    );
    expect(Redis.prototype.expire).toHaveBeenCalledWith(
      `event_${eventId}_user_${userId}_holds_count`,
      holdDurationInSeconds * 2
    );
  });

  it("returns a 500 if no valid hold found", async () => {
    (Redis.prototype.get as jest.Mock).mockResolvedValue(null);

    const response = await request(app)
      .post(`/api/events/${eventId}/seats/${seatId}/hold/refresh`)
      .send({ userId })
      .expect(500);

    expect(response.body).toEqual({
      message: "Failed to refresh hold on seat",
      error: "No valid hold found or hold belongs to another user",
    });

    expect(Redis.prototype.get).toHaveBeenCalledWith(
      `event_${eventId}_seat_${seatId}_user_${userId}_hold`
    );
    expect(updateHold).not.toHaveBeenCalled();
  });

  it("handles unexpected errors during hold refresh", async () => {
    (Redis.prototype.get as jest.Mock).mockRejectedValue(
      new Error("Unexpected error")
    );

    const response = await request(app)
      .post(`/api/events/${eventId}/seats/${seatId}/hold/refresh`)
      .send({ userId })
      .expect(500);

    expect(response.body).toEqual({
      message: "Failed to refresh hold on seat",
      error: "Unexpected error",
    });

    expect(Redis.prototype.get).toHaveBeenCalledWith(
      `event_${eventId}_seat_${seatId}_user_${userId}_hold`
    );
  });
});
