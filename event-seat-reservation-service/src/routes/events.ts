import { Router } from "express";
import { EventService } from "../services/eventService";
import { validateEventCreation } from "./validations/eventValidation";

const router = Router();
const eventService = new EventService();

router.post("/", validateEventCreation(), async (req, res) => {
  const { name, totalSeats } = req.body;
  try {
    const eventId = await eventService.createEvent(name, parseInt(totalSeats));
    res
      .status(201)
      .json({ eventId: eventId, message: "Event created successfully" });
  } catch (error) {
    console.error(error);
    if (error.code === "23505") {
      return res
        .status(400)
        .json({ message: `An event with the name '${name}' already exists.` });
    }
    return res.status(500).json({ message: "Failed to create event" });
  }
});

export default router;
