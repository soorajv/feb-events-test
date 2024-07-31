import Joi from "joi";
import { Request, Response, NextFunction } from "express";
import { RequestValidationError } from "../errors/request-validation-error";

// Schema for validating seat and event parameters from the URL
const seatParamsSchema = Joi.object({
  eventId: Joi.number().integer().required().messages({
    "number.base": "Event ID must be a number",
    "any.required": "Event ID is required",
  }),
  seatId: Joi.number().integer().required().messages({
    "number.base": "Seat ID must be a number",
    "any.required": "Seat ID is required",
  }),
  userId: Joi.string().guid({ version: "uuidv4" }).required().messages({
    "string.guid": "User ID must be a valid UUID",
    "any.required": "User ID is required",
  }),
});

export const validateSeatParams =
  () => (req: Request, res: Response, next: NextFunction) => {
    const { error } = seatParamsSchema.validate(
      { ...req.params, ...req.body },
      { abortEarly: false }
    );
    if (error) {
      throw new RequestValidationError(error);
    }
    next();
  };
