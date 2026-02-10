import Joi from 'joi';
import { PaymentStatus, DeliveryStatus, IOrder, OrderStatus } from '../models/OrderModel';
import { fileInfoSchema } from './fileValidation';

export const orderValidationSchema = Joi.object<IOrder>({
  //   userId: Joi.string(),
  products: Joi.array()
    .items(
      Joi.object({
        productId: Joi.string().required().messages({
          'any.required': 'Product ID is required',
          'string.base': 'Product ID must be a string',
        }),
        quantity: Joi.number().integer().min(1).required().messages({
          'any.required': 'Quantity is required',
          'number.base': 'Quantity must be a number',
          'number.min': 'Quantity must be at least 1',
        }),
      })
    )
    .min(1)
    .required()
    .messages({
      'array.base': 'Products must be an array of productId and quantity objects',
      'array.min': 'At least one product is required',
      'any.required': 'Products are required',
    }),

  // price: Joi.number()
  //   .positive()
  //   .precision(2)
  //   .required()
  //   .messages({
  //     'number.base': 'Price must be a number',
  //     'number.positive': 'Price must be positive',
  //     'any.required': 'Price is required',
  //   }),

  //   payment: Joi.string()
  //     .valid(...Object.values(PaymentStatus))
  //     .required()
  //     .messages({
  //       'any.only': `Payment status must be one of: ${Object.values(PaymentStatus).join(', ')}`,
  //       'any.required': 'Payment status is required',
  //     }),

  //   status: Joi.string()
  //     .valid(...Object.values(DeliveryStatus))
  //     .required()
  //     .messages({
  //       'any.only': `Delivery status must be one of: ${Object.values(DeliveryStatus).join(', ')}`,
  //       'any.required': 'Delivery status is required',
  //     }),
});

export const createOrderSchema = Joi.object({
  userId: Joi.string().required(),
  products: Joi.array().items(
    Joi.object({
      productId: Joi.string().required(),
      quantity: Joi.number().integer().min(1).required(),
      selectedVariants: Joi.array().items(
        Joi.object({
          name: Joi.string().required(),
          value: Joi.string().required()
        })
      ).optional(),
      notes: Joi.string().max(500).optional()
    })
  ).min(1).required(),
  orderId: Joi.string().optional(),
  paymentStatus: Joi.string().valid(...Object.values(PaymentStatus)).optional(),
  deliveryStatus: Joi.string().valid(...Object.values(DeliveryStatus)).optional(),
  shippingAddressId: Joi.string().optional(),
  billingAddressId: Joi.string().optional()
});

// For update operations, you might want a partial validation schema
export const updateOrderValidationSchema = Joi.object({
  userId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.empty': 'User ID cannot be empty',
      'string.pattern.base': 'User ID must be a valid ObjectId',
    }),

  products: Joi.array()
    .items(
      Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
    )
    .min(1)
    .messages({
      'array.base': 'Products must be an array',
      'array.min': 'At least one product is required',
    }),

  date: Joi.date()
    .messages({
      'date.base': 'Date must be a valid date',
    }),

  price: Joi.number()
    .positive()
    .precision(2)
    .messages({
      'number.base': 'Price must be a number',
      'number.positive': 'Price must be positive',
    }),

  payment: Joi.string()
    .valid(...Object.values(PaymentStatus))
    .messages({
      'any.only': `Payment status must be one of: ${Object.values(PaymentStatus).join(', ')}`,
    }),

  status: Joi.string()
    .valid(...Object.values(DeliveryStatus))
    .messages({
      'any.only': `Delivery status must be one of: ${Object.values(DeliveryStatus).join(', ')}`,
    }),
}).min(1); // At least one field should be provided for update


export const orderTrackingSchema = Joi.object({
  status: Joi.string()
    .valid(...Object.values(OrderStatus))
    .required()
    .messages({
      "any.only": `Invalid status. Allowed statuses: ${Object.values(OrderStatus).join(", ")}`,
      "string.empty": "Status is required",
      "any.required": "Status is required",
    }),

  location: Joi.string()
    .required()
    .messages({
      "string.empty": "Location is required",
      "any.required": "Location is required",
    }),

  description: Joi.string().optional(),

  uploadedFiles: Joi.array().items(fileInfoSchema).default([]),
});


export const shippingValidationSchema = Joi.object({
  logisticWebsite: Joi.string().required(),
  trackingNumber: Joi.string()
    .required()
    .min(10)
    .max(50),
  logisticName: Joi.string()
    .required()
    .min(2)
    .max(50)
    .messages({
      'string.base': 'logistic name must be a string',
      'string.empty': 'logistic name cannot be empty',
      'string.min': 'logistic name must be at least 3 characters long',
      'string.max': 'logistic name cannot exceed 50 characters',
      'any.required': 'logistic name is required'
    }),
  uploadedFiles: Joi.array().items(fileInfoSchema).default([]),
});