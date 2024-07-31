import { Router } from "express";
import Joi from "joi";
import { EventService } from "../services/eventService";

const router = Router();
const eventService = new EventService();

// Joi schema for eventId validation
const eventIdSchema = Joi.number().integer().positive().required();

// Route for listing available seats
router.get("/:eventId/seats/available", async (req, res) => {
  const { eventId } = req.params;
  const { error } = eventIdSchema.validate(eventId);

  if (error) {
    return res.status(400).json({
      message: "Invalid Event ID",
      details: error.details.map((detail) => detail.message),
    });
  }

  try {
    const availableSeats = await eventService.listAvailableSeats(
      parseInt(eventId)
    );
    res.status(200).json(availableSeats);
  } catch (error) {
    console.error("Failed to list available seats:", error);
    res.status(500).json({
      message: "Failed to list available seats",
      error: error.message,
    });
  }
});

export default router;
