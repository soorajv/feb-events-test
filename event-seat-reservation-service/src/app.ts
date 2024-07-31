import express, { Express } from "express";
import cors from "cors";

import { appRoutes } from "./routes";
import { errorHandler } from "./routes/errors/error-handler";

const app: Express = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (_, res) =>
  res.send("Event Seat Reservation Service is running!")
);

app.use("/api", appRoutes);

app.use(errorHandler);

export { app };
