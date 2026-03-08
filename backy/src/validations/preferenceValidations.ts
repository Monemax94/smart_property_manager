import Joi from 'joi';
import { CurrencyCode } from '../models/Payments';

// Common validation rules
const booleanRule = Joi.boolean().messages({
  'boolean.base': '{{#label}} must be a boolean'
});


// Create schema (for initial creation)
export const createNotificationPreferenceSchema = Joi.object({
  email: booleanRule.default(true),
  sms: booleanRule.default(false),
  browser: booleanRule.default(true),
  systemUpdates: booleanRule.default(true),
  transactionUpdates: booleanRule.default(true),
  marketingPromotions: booleanRule.default(false),
  securityAlerts: booleanRule.default(true)
}).options({ stripUnknown: true });

// Update schema (for partial updates)
export const updateNotificationPreferenceSchema = Joi.object({
  email: booleanRule.optional(),
  sms: booleanRule.optional(),
  browser: booleanRule.optional(),
  systemUpdates: booleanRule.optional(),
  transactionUpdates: booleanRule.optional(),
  marketingPromotions: booleanRule.optional(),
  securityAlerts: booleanRule.optional()
}).options({ stripUnknown: true });


const stringRule = Joi.string().messages({
  'string.base': '{{#label}} must be a string'
});

// Create schema
export const createApplicationPreferenceSchema = Joi.object({
  darkMode: booleanRule.default(false),
  defaultCurrency: stringRule.default(CurrencyCode.USD)
    .valid(...Object.values(CurrencyCode))
    .messages({
      'any.only': 'Unsupported currency. Supported: {{#valids}}'
    }),
  defaultLanguage: stringRule.default('English')
    .valid('English', 'French', 'Spanish', 'German', 'Chinese') // Add supported languages
    .messages({
      'any.only': 'Unsupported language. Supported: {{#valids}}'
    }),
  defaultTimezone: stringRule.default('UTC (Coordinated Universal Time)'),
  dateFormat: stringRule.default('MM/DD/YYYY')
    .valid('MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD') // Add supported formats
    .messages({
      'any.only': 'Unsupported date format. Supported: {{#valids}}'
    }),
  // Notifications
  pushNotifications: booleanRule.default(false),
  emailNotifications: booleanRule.default(false),
  announcements: booleanRule.default(false),

  // Security
  twoFactorEnabled: booleanRule.default(false),
  twoFactorMethod: stringRule
    .valid('EMAIL', 'AUTH_APP')
    .default('AUTH_APP')
    .when('twoFactorEnabled', {
      is: true,
      then: Joi.optional(),
      otherwise: Joi.optional()
    })
    .messages({
      'any.only': 'Two-factor method must be EMAIL or AUTH_APP'
    }),

  biometricLoginEnabled: booleanRule.default(false)

}).options({ stripUnknown: true });

// Update schema
export const updateApplicationPreferenceSchema = Joi.object({
  darkMode: booleanRule.optional(),
  defaultCurrency: stringRule.default(CurrencyCode.USD)
    .valid(...Object.values(CurrencyCode))
    .messages({
      'any.only': 'Unsupported currency. Supported: {{#valids}}'
    }),
  defaultLanguage: stringRule.optional()
    .valid('English', 'French', 'Spanish', 'German', 'Chinese')
    .messages({
      'any.only': 'Unsupported language. Supported: {{#valids}}'
    }),
  defaultTimezone: stringRule.optional(),
  dateFormat: stringRule.optional()
    .valid('MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD')
    .messages({
      'any.only': 'Unsupported date format. Supported: {{#valids}}'
    }),
  // Notifications
  pushNotifications: booleanRule.optional(),
  emailNotifications: booleanRule.optional(),
  announcements: booleanRule.optional(),

  // Security
  twoFactorEnabled: booleanRule.optional(),

  twoFactorMethod: stringRule
    .valid('EMAIL', 'AUTH_APP')
    .default('AUTH_APP')
    .when('twoFactorEnabled', {
      is: true,
      then: Joi.optional()
    })
    .messages({
      'any.only': 'Two-factor method must be EMAIL or AUTH_APP'
    }),

  biometricLoginEnabled: booleanRule.optional()
}).options({ stripUnknown: true });