import Joi from 'joi';

export const NewsletterValidation = {
  subscribeSchema: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'string.empty': 'Email is required'
    }),
    organization: Joi.alternatives().try(
      Joi.string().pattern(/^[0-9a-fA-F]{24}$/).message('Organization ID must be a valid MongoDB ObjectId'),
      Joi.string().min(2).max(50).pattern(/^[a-z0-9-]+$/).message('Organization slug must contain only lowercase letters, numbers, and hyphens')
    ).required().messages({
      'any.required': 'Organization is required',
      'alternatives.match': 'Organization must be either a valid ID or slug'
    }),
    preferences: Joi.object({
      productUpdates: Joi.boolean().default(true),
      promotions: Joi.boolean().default(true),
      news: Joi.boolean().default(true),
      events: Joi.boolean().default(false)
    }).optional()
  }),

  unsubscribeSchema: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'string.empty': 'Email is required'
    }),
    organization: Joi.alternatives().try(
      Joi.string().pattern(/^[0-9a-fA-F]{24}$/).message('Organization ID must be a valid MongoDB ObjectId'),
      Joi.string().min(2).max(50).pattern(/^[a-z0-9-]+$/).message('Organization slug must contain only lowercase letters, numbers, and hyphens')
    ).required().messages({
      'any.required': 'Organization is required',
      'alternatives.match': 'Organization must be either a valid ID or slug'
    })
  }),

  updatePreferencesSchema: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'string.empty': 'Email is required'
    }),
    organization: Joi.alternatives().try(
      Joi.string().pattern(/^[0-9a-fA-F]{24}$/).message('Organization ID must be a valid MongoDB ObjectId'),
      Joi.string().min(2).max(50).pattern(/^[a-z0-9-]+$/).message('Organization slug must contain only lowercase letters, numbers, and hyphens')
    ).required().messages({
      'any.required': 'Organization is required',
      'alternatives.match': 'Organization must be either a valid ID or slug'
    }),
    preferences: Joi.object({
      productUpdates: Joi.boolean(),
      promotions: Joi.boolean(),
      news: Joi.boolean(),
      events: Joi.boolean()
    }).required().messages({
      'object.base': 'Preferences must be an object',
      'any.required': 'Preferences are required'
    })
  }),

  // New schema for getting subscription status
  getStatusSchema: Joi.object({
    email: Joi.string().email().lowercase().required().messages({
      'string.email': 'Please provide a valid email address',
      'string.empty': 'Email is required'
    }),
    organization: Joi.alternatives().try(
      Joi.string().pattern(/^[0-9a-fA-F]{24}$/).message('Organization ID must be a valid MongoDB ObjectId'),
      Joi.string().min(2).max(50).pattern(/^[a-z0-9-]+$/).message('Organization slug must contain only lowercase letters, numbers, and hyphens')
    ).required().messages({
      'any.required': 'Organization is required',
      'alternatives.match': 'Organization must be either a valid ID or slug'
    })
  }),

  // Schema for getting subscribers list
  getSubscribersSchema: Joi.object({
    page: Joi.number().integer().min(1).default(1).messages({
      'number.base': 'Page must be a number',
      'number.min': 'Page must be at least 1'
    }),
    limit: Joi.number().integer().min(1).max(100).default(50).messages({
      'number.base': 'Limit must be a number',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100'
    })
  }),

  // Schema for sending organization newsletter
  sendNewsletterSchema: Joi.object({
    subject: Joi.string().min(1).max(200).optional().messages({
      'string.empty': 'Subject cannot be empty',
      'string.max': 'Subject cannot exceed 200 characters'
    }),
    htmlContent: Joi.string().min(1).optional().messages({
      'string.empty': 'HTML content cannot be empty'
    }),
    textContent: Joi.string().min(1).optional().messages({
      'string.empty': 'Text content cannot be empty'
    }),
    segment: Joi.string().valid('all', 'active', 'inactive').default('all').messages({
      'any.only': 'Segment must be one of: all, active, inactive'
    })
  })
};