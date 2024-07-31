import * as Joi from "joi";
import { CustomError } from "./custom-error";

export class RequestValidationError extends CustomError {
  statusCode = 400;
  constructor(private _errors: Joi.ValidationError) {
    super("Invalid request parameters");
    Object.setPrototypeOf(this, RequestValidationError.prototype);
    this.name = "BadRequestError";
  }

  serializeErrors() {
    return this._errors.details.map((err) => {
      return { message: err.message, field: err.context?.label };
    });
  }
}
