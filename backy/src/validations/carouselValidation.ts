import Joi from "joi";
import { fileInfoSchema } from "./fileValidation";

export const carouselValidationSchema = Joi.object({
  title: Joi.string()
    .required()
    .min(2)
    .max(100)
    .messages({
      "string.empty": "Title is required",
      "string.min": "Title must be at least 2 characters long",
      "string.max": "Title cannot exceed 100 characters",
    }),

  subtitle: Joi.string()
    .allow("")
    .max(300)
    .messages({
      "string.max": "Subtitle cannot exceed 300 characters",
    }),
  backgroundColor: Joi.string()
    .allow("")
    .max(300)
    .messages({
      "string.max": "Enter background",
    }),

  buttonText: Joi.string()
    .allow("")
    .max(50)
    .messages({
      "string.max": "Button text cannot exceed 50 characters",
    }),

  buttonLink: Joi.string()
    .allow("")
    .max(255)
    .messages({
      "string.max": "Button link cannot exceed 255 characters",
    }),

  position: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      "number.base": "Position must be a number",
      "number.min": "Position must be at least 1",
    }),

  isActive: Joi.boolean().default(true),
  uploadedFiles: Joi.array().items(fileInfoSchema).default([]),
});
