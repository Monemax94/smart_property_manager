import Joi from 'joi';
// import { PaymentStatus, DeliveryStatus, IOrder, OrderStatus } from '../models/OrderModel';
import { fileInfoSchema } from './fileValidation';

// Legacy Order validations commented out
export const orderValidationSchema = Joi.object({
  // ...
});

export const createOrderSchema = Joi.object({
  // ...
});

export const updateOrderValidationSchema = Joi.object({
  // ...
});

export const orderTrackingSchema = Joi.object({
  // ...
});

export const shippingValidationSchema = Joi.object({
  logisticWebsite: Joi.string().required(),
  trackingNumber: Joi.string().required(),
  logisticName: Joi.string().required(),
  uploadedFiles: Joi.array().items(fileInfoSchema).default([]),
});