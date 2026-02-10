import Joi from 'joi';
import { fileInfoSchema } from './fileValidation';
import { objectIdValidator } from './utilsValidations';

export const reviewValidationSchema = Joi.object({


  orderId: Joi.string()
    .custom(objectIdValidator, 'ObjectId Validation')
    .optional(),

  propertyId: Joi.string()
    .custom(objectIdValidator, 'ObjectId Validation')
    .optional(),
  uploadedFiles: Joi.array().items(fileInfoSchema).default([]),
  rating: Joi.number()
    .integer()
    .min(1)
    .max(5)
    .required()
    .messages({
      'number.base': 'Rating must be a number',
      'number.integer': 'Rating must be an integer',
      'number.min': 'Rating must be at least 1',
      'number.max': 'Rating must be at most 5',
      'any.required': 'Rating is required'
    }),
    vendorRating: Joi.number()
    .integer()
    .min(1)
    .max(5)
    .required()
    .messages({
      'number.base': 'Rating must be a number',
      'number.integer': 'Rating must be an integer',
      'number.min': 'Rating must be at least 1',
      'number.max': 'Rating must be at most 5',
      'any.required': 'Rating is required'
    }),
  comment: Joi.string()
    .required()
    .min(3)
    .max(2000)
    .messages({
      'string.base': 'Comment must be a string',
      'string.empty': 'Comment cannot be empty',
      'string.min': 'Comment must be at least 3 characters long',
      'string.max': 'Comment cannot exceed 2000 characters',
      'any.required': 'Comment is required'
    }),
});

// Update review validation schema (all fields optional but at least one required)
export const updateReviewValidationSchema = reviewValidationSchema
  .fork(
    ['rating', 'comment'],
    (schema) => schema.optional()
  )
  .min(1)
  .messages({
    'object.min': 'At least one field must be provided for update'
  });

// Validation for adding/removing likes/dislikes
export const reviewReactionSchema = Joi.object({
  action: Joi.string()
    .valid('like', 'dislike', 'remove-like', 'remove-dislike')
    .required()
    .messages({
      'any.required': 'Action is required',
      'any.only': 'Action must be one of: like, dislike, remove-like, remove-dislike'
    }),
  userId: Joi.string()

});

// export const bulkReviewSchema = Joi.array().items(
//   Joi.object({
//     productId: Joi.string().required(),
//     rating: Joi.number().min(1).max(5).required(),
//     comment: Joi.string().optional().allow(""),
//     uploadedFiles: Joi.array().items(fileInfoSchema).default([]),
//   })
// );

export const bulkReviewSchema = Joi.object({
  reviews: Joi.array().items(
    Joi.object({
      productId: Joi.string().required(),
      rating: Joi.number().min(1).max(5).required(),
      comment: Joi.string().optional().allow(""),
    })
  ).required(),
  uploadedFiles: Joi.array().items(fileInfoSchema).default([])
});
