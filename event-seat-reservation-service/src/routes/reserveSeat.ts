import { Router } from "express";
import { EventService } from "../services/eventService";
import { validateSeatParams } from "./validations/seatValidation";

const router = Router();
const eventService = new EventService();

router.post(
  "/events/:eventId/seats/:seatId/reserve",
  validateSeatParams(),
  async (req, res) => {
    const { eventId, seatId } = req.params;
    const { userId } = req.body;

    try {
      const result = await eventService.reserveSeat(
        parseInt(eventId),
        parseInt(seatId),
        userId
      );
      res.status(200).json({
        message: "Seat reserved successfully",
        eventId,
        seatId,
        userId,
        result,
      });
    } catch (error) {
      console.error("Failed to reserve seat:", error);

      if (error.code === "23503") {
        return res
          .status(400)
          .json({ message: `The provided data not exists in the system.` });
      }
      return res
        .status(500)
        .json({ message: "Failed to reserve seat", error: error.message });
    }
  }
);

export default router;
