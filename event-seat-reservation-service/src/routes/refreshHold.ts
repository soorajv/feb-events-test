import { Router } from "express";
import { EventService } from "../services/eventService";
import { validateSeatParams } from "./validations/seatValidation";

const router = Router();
const eventService = new EventService();

router.post(
  "/events/:eventId/seats/:seatId/hold/refresh",
  validateSeatParams(),
  async (req, res) => {
    const { eventId, seatId } = req.params;
    const { userId } = req.body;

    try {
      const result = await eventService.refreshHold(
        parseInt(eventId),
        parseInt(seatId),
        userId
      );
      res.status(200).json({
        message: "Hold on seat refreshed successfully",
        details: result,
      });
    } catch (error) {
      console.error("Failed to refresh hold on seat:", error);
      return res.status(500).json({
        message: "Failed to refresh hold on seat",
        error: error.message,
      });
    }
  }
);

export default router;
