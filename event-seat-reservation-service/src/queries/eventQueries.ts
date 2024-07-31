import { PoolClient } from "pg";

// Insert a new event and return id
const insertEventStatement = `
  INSERT INTO events (name, total_seats)
  VALUES ($1, $2)
  RETURNING id;
`;

// SQL query to fetch available seats
const listAvailableSeatsStatement = `
  SELECT s.id, s.seat_number
  FROM seats s
  LEFT JOIN holds h ON s.id = h.seat_id AND h.expires_at > NOW()
  LEFT JOIN reservations r ON s.id = r.seat_id
  WHERE s.event_id = $1 AND h.id IS NULL AND r.id IS NULL
  ORDER BY s.seat_number;
`;

// Function to list available seats
export const listAvailableSeats = async (
  db: PoolClient,
  eventId: number
): Promise<any[]> => {
  const result = await db.query(listAvailableSeatsStatement, [eventId]);
  return result.rows;
};
// SQL query to reserve a seat
const reserveSeatStatement = `
  INSERT INTO reservations (seat_id, user_id)
  SELECT seat_id, user_id FROM holds
  WHERE seat_id = $1 AND user_id = $2 AND expires_at > NOW()
  ON CONFLICT (seat_id) DO NOTHING
  RETURNING id;
`;
// SQL query to update hold
const updateHoldStatement = `
  UPDATE holds
  SET expires_at = NOW() + $3 * interval '1 second'
  WHERE seat_id = $1 AND user_id = $2
  RETURNING *;
`;

export const updateHold = async (
  db: PoolClient,
  seatId: number,
  userId: string,
  holdDurationInSeconds: number
) => {
  const result = await db.query(updateHoldStatement, [
    seatId,
    userId,
    holdDurationInSeconds,
  ]);
  return result.rows[0];
};

export const deleteHold = async (
  db: PoolClient,
  seatId: number
): Promise<void> => {
  const deleteHoldStatement = `
    DELETE FROM holds
    WHERE seat_id = $1;
  `;
  await db.query(deleteHoldStatement, [seatId]);
};
//  reserve a seat
export const reserveSeat = async (
  db: PoolClient,
  seatId: number,
  userId: string
): Promise<any[]> => {
  const result = await db.query(reserveSeatStatement, [seatId, userId]);
  return result.rows;
};
// Hold a seat  Statement
const holdSeatStatement = `
  WITH valid_seat AS (
    SELECT 1
    FROM seats
    WHERE id = $2 AND event_id = $1
    AND NOT EXISTS (
    SELECT 1 FROM reservations WHERE seat_id = $2
  )
  )
  INSERT INTO holds (event_id, seat_id, user_id, expires_at)
  SELECT $1, $2, $3, NOW() + $4 * interval '1 second'
  FROM valid_seat
  ON CONFLICT (seat_id) DO UPDATE
    SET
      user_id = CASE
                  WHEN (EXCLUDED.user_id = holds.user_id OR holds.expires_at < NOW()) THEN EXCLUDED.user_id
                  ELSE holds.user_id
                END,
      expires_at = CASE
                     WHEN (EXCLUDED.user_id = holds.user_id OR holds.expires_at < NOW()) THEN NOW() + $4 * interval '1 second'
                     ELSE holds.expires_at
                   END
  RETURNING id;
`;

// Insert event
export const insertEvent = async (
  db: PoolClient,
  name: string,
  totalSeats: number
) => {
  const res = await db.query(insertEventStatement, [name, totalSeats]);
  return res.rows[0].id;
};

// Hold a seat
export const holdSeat = async (
  db: PoolClient,
  eventId: number,
  seatId: number,
  userId: string,
  holdDurationInSeconds: number
) => {
  const result = await db.query(holdSeatStatement, [
    eventId,
    seatId,
    userId,
    holdDurationInSeconds,
  ]);
  if (result.rows.length === 0) {
    throw new Error("The seat is already reserved or does not exist.");
  }
  return result.rows[0];
};

// Insert multiple seats for an event
export const insertSeats = async (
  db: PoolClient,
  eventId: number,
  totalSeats: number
) => {
  const numbers = Array.from({ length: totalSeats }, (_, index) => index + 1);
  const sql = `
    INSERT INTO seats (event_id, seat_number)
    SELECT $1, unnest($2::int[])
  `;
  await db.query(sql, [eventId, numbers]);
};
