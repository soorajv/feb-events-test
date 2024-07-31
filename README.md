````markdown
# Event Seat Reservation Service

This project implements a system for reserving seats at events, allowing users to  
hold, reserve, and manage seats efficiently. The application is built with Node.js  
and Express, utilizing PostgreSQL for data management and Redis for managing  
 stateful operations such as seat holds.

## Getting Started

Follow these instructions to set up the project on your local machine for development and  
testing purposes.

### Prerequisites

- Node.js
- PostgreSQL
- Redis
- Docker

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/soorajv/feb-events-test
   cd event-seat-reservation
   ```
````

2. Ensure Docker is running.

3. Navigate to the Docker directory and run:

   ```bash
   cd docker
   docker-compose up --build
   ```

4. Wait for Docker Compose to finish setting up the environment.

5. Refer to the included Postman collection for API testing.

### Unit Tests

Unit tests for all routes are included in the project. To run these tests, execute the following command in your terminal:

```bash
npm run unit-test
```

## Please Refer

Technical_Design_Document.pdf

API_SPECIFICATION.yaml

events.postman_collection.json

## API end points

Seats Available : GET http://localhost:3000/api/events/:eventId/seats/available

Create Events : POST http://localhost:3000/api/events

Hold Seat: POST http://localhost:3000/api/events/:eventId/seats/:seatId/hold

Refresh Hold: POST http://localhost:3000/api/events/:eventId/seats/:seatId/hold/refresh

Researve Seat : POST http://localhost:3000/api/events/:eventId/seats/:seatId/reserve
