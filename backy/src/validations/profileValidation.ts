import Joi from "joi";
import { fileInfoSchema } from './fileValidation';

export const profileValidationSchema = Joi.object({
    alternateEmail: Joi.string()
        .email()
        .allow('')
        .messages({
            'string.email': 'Alternate email must be a valid email address'
        }),

    firstName: Joi.string()
        .required()
        .min(2)
        .max(50)
        .messages({
            'string.base': 'First name must be a string',
            'string.empty': 'First name cannot be empty',
            'string.min': 'First name must be at least 2 characters long',
            'string.max': 'First name cannot exceed 50 characters',
            'any.required': 'First name is required'
        }),

    lastName: Joi.string()
        .required()
        .min(2)
        .max(50)
        .messages({
            'string.base': 'Last name must be a string',
            'string.empty': 'Last name cannot be empty',
            'string.min': 'Last name must be at least 2 characters long',
            'string.max': 'Last name cannot exceed 50 characters',
            'any.required': 'Last name is required'
        }),

    uploadedFiles: Joi.array().items(fileInfoSchema).default([]),
    address: Joi.string()
        .max(200)
        .allow('')
        .messages({
            'string.base': 'Address must be a string',
            'string.max': 'Address cannot exceed 200 characters'
        }),

    timeZone: Joi.string(),
    jobTitle: Joi.string()
        .max(100)
        .allow('')
        .messages({
            'string.base': 'Job title must be a string',
            'string.max': 'Job title cannot exceed 100 characters'
        }),
    bio: Joi.string()
        .max(500)
        .allow('')
        .messages({
            'string.base': 'Bio must be a string',
            'string.max': 'Bio cannot exceed 500 characters'
        })
});

// Update validation schema (all fields optional)
export const updateProfileValidationSchema = profileValidationSchema.fork(
    ['firstName', 'lastName'],
    (schema) => schema.optional()
).min(1).messages({
    'object.min': 'At least one field must be provided for update'
});


export const createOrUpdateBankPayoutSchema = Joi.object({
    swiftCode: Joi.string()
        .trim()
        .min(6)
        .max(11)
        .required()
        .messages({
            "string.empty": "Swift code is required",
            "string.min": "Swift code must be at least 6 characters",
            "any.required": "Swift code is required"
        }),
    bankName: Joi.string()
        .trim()
        .min(3)
        .max(100)
        .required()
        .messages({
            "string.empty": "bank name is required",
            "any.required": "bank name is required"
        }),
    accountName: Joi.string()
        .trim()
        .min(3)
        .max(100)
        .required()
        .messages({
            "string.empty": "Account name is required",
            "any.required": "Account name is required"
        }),

    accountNumber: Joi.string()
        .trim()
        .pattern(/^[0-9]{8,20}$/)
        .required()
        .messages({
            "string.pattern.base": "Account number must be between 8 and 20 digits",
            "string.empty": "Account number is required",
            "any.required": "Account number is required"
        }),
    pin: Joi.string().pattern(/^\d{4}$/).required(),
    metadata: Joi.object().optional()
});
