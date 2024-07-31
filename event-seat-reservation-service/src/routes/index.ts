import { Router } from "express";
import eventRoutes from "./events";
import holdRSeat from "./holdSeat";
import reserveSeat from "./reserveSeat";
import availableSeats from "./availableSeats";
import refreshHold from "./refreshHold";
const appRoutes = Router();

appRoutes.use("/events", eventRoutes);
appRoutes.use("/", holdRSeat);
appRoutes.use("/", reserveSeat);
appRoutes.use("/", refreshHold);
appRoutes.use("/events", availableSeats);
export { appRoutes };
