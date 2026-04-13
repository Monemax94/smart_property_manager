import Joi from "joi";
// import { SubscriptionPlan } from '../models/Plan';

export const createFeeSchema = Joi.object({
    percentage: Joi.number().min(0).max(100).required()
});

export const createPlanSchema = Joi.object({
  name: Joi.string().required(),
  price: Joi.number().positive().required(),
  durationInDays: Joi.number().integer().min(1).required(),
//   plan: Joi.string()
//     .valid(...Object.values(SubscriptionPlan))
//     .required(),
  description: Joi.string().optional().allow('')
});

export const updatePlanSchema = Joi.object({
  name: Joi.string().optional(),
  price: Joi.number().positive().optional(),
  durationInDays: Joi.number().integer().min(1).optional(),
//   plan: Joi.string()
//     .valid(...Object.values(SubscriptionPlan))
//     .optional(),
  description: Joi.string().optional().allow('')
}).min(1);