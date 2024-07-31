import Joi from "joi";
import { Request, Response, NextFunction } from "express";
import { RequestValidationError } from "../errors/request-validation-error";

// Schema definition for event creation
const eventCreationSchema = Joi.object({
  name: Joi.string().trim().required().messages({
    "string.empty": "Name is required",
    "any.required": "Name is required",
  }),
  totalSeats: Joi.number().integer().min(10).max(1000).required().messages({
    "number.base": "Total seats must be a number",
    "number.min": "Total seats must be at least 10",
    "number.max": "Total seats cannot exceed 1000",
    "any.required": "Total seats are required",
  }),
});

export const validateEventCreation = () => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = eventCreationSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      throw new RequestValidationError(error);
    }
    next();
  };
};
