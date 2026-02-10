import Joi from "joi";
import { SubscriptionPlan } from '../models/Plan';

export const createFeeSchema = Joi.object({
    percentage: Joi.number().min(0).max(100).required()
        .messages({
            'number.base': 'Percentage must be a number',
            'number.min': 'Percentage must be at least 0',
            'number.max': 'Percentage cannot exceed 100',
            'any.required': 'Percentage is required'
        })
});

export const createPlanSchema = Joi.object({
  name: Joi.string().required().messages({
    'string.base': 'Name must be a string',
    'string.empty': 'Name cannot be empty',
    'any.required': 'Name is required'
  }),
  price: Joi.number().positive().required().messages({
    'number.base': 'Price must be a number',
    'number.positive': 'Price must be a positive number',
    'any.required': 'Price is required'
  }),
  durationInDays: Joi.number().integer().min(1).required().messages({
    'number.base': 'Duration must be a number',
    'number.integer': 'Duration must be an integer',
    'number.min': 'Duration must be at least 1 day',
    'any.required': 'Duration is required'
  }),
  plan: Joi.string()
    .valid(...Object.values(SubscriptionPlan))
    .required()
    .messages({
      'string.base': 'Plan must be a string',
      'any.only': `Plan must be one of: ${Object.values(SubscriptionPlan).join(', ')}`,
      'any.required': 'Plan is required'
    }),
  description: Joi.string().optional().allow('').messages({
    'string.base': 'Description must be a string'
  })
});

export const updatePlanSchema = Joi.object({
  name: Joi.string().optional().messages({
    'string.base': 'Name must be a string',
    'string.empty': 'Name cannot be empty'
  }),
  price: Joi.number().positive().optional().messages({
    'number.base': 'Price must be a number',
    'number.positive': 'Price must be a positive number'
  }),
  durationInDays: Joi.number().integer().min(1).optional().messages({
    'number.base': 'Duration must be a number',
    'number.integer': 'Duration must be an integer',
    'number.min': 'Duration must be at least 1 day'
  }),
  plan: Joi.string()
    .valid(...Object.values(SubscriptionPlan))
    .optional()
    .messages({
      'string.base': 'Plan must be a string',
      'any.only': `Plan must be one of: ${Object.values(SubscriptionPlan).join(', ')}`
    }),
  description: Joi.string().optional().allow('').messages({
    'string.base': 'Description must be a string'
  })
}).min(1); // At least one field should be provided for update