
CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    total_seats INT NOT NULL CHECK (total_seats BETWEEN 10 AND 1000),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Create seats table
CREATE TABLE IF NOT EXISTS seats (
    id SERIAL PRIMARY KEY,
    event_id INT NOT NULL,
    seat_number INT NOT NULL,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- Create holds table
CREATE TABLE IF NOT EXISTS holds (
    id SERIAL PRIMARY KEY,
    event_id INT NOT NULL,
    seat_id INT NOT NULL,
    user_id UUID NOT NULL,
    expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    FOREIGN KEY (seat_id) REFERENCES seats(id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    UNIQUE (seat_id)  -- Ensures that each seat can only be held by one user at a time
);

-- Create reservations table
CREATE TABLE IF NOT EXISTS reservations (
    id SERIAL PRIMARY KEY,
    seat_id INT NOT NULL,
    user_id UUID NOT NULL,
    reserved_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (seat_id) REFERENCES seats(id) ON DELETE CASCADE,
    UNIQUE (seat_id)  -- Ensures that each seat can only be reserved by one user at a time
);
-- Indexes 
CREATE INDEX IF NOT EXISTS idx_seats_seat_number ON seats(seat_number);

CREATE INDEX IF NOT EXISTS idx_holds_expires_at ON holds(expires_at);
CREATE INDEX IF NOT EXISTS idx_holds_user_id ON holds(user_id);

CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_reserved_at ON reservations(reserved_at);


-- Schedule a job to clear expired holds every hour
SELECT cron.schedule('Clear expired holds every hour', '0 * * * *', $$
    DELETE FROM holds WHERE expires_at < NOW();
$$);