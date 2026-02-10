import Joi from "joi";

export const CreateCouponSchema = Joi.object({
  code: Joi.string().optional(),
  discountType: Joi.string().valid('PERCENT', 'AMOUNT').required(),
  discountValue: Joi.number().positive().required(),
  expiresAt: Joi.date().optional(),
  usageLimit: Joi.number().integer().min(1).optional(),
  userId: Joi.string().optional(),
});

// Update coupon schema (all fields optional but at least one required)
export const UpdateCouponSchema = Joi.object({
  code: Joi.string().optional(),
  discountType: Joi.string().valid('PERCENT', 'AMOUNT').optional(),
  discountValue: Joi.number().positive().optional(),
  expiresAt: Joi.date().optional(),
  usageLimit: Joi.number().integer().min(1).optional(),
  userId: Joi.string().optional(),
}).min(1); // At least one field required

// Validate coupon schema
export const ValidateCouponSchema = Joi.object({
  userId: Joi.string().optional(),
  orderAmount: Joi.number().positive().optional(),
});

// Apply coupon schema
export const ApplyCouponSchema = Joi.object({
  userId: Joi.string().required(),
  orderAmount: Joi.number().positive().required(),
});

// Bulk create schema using the same CreateCouponSchema pattern
export const BulkCreateCouponSchema = Joi.array().items(
  CreateCouponSchema
).min(1).max(50); // Limit bulk creation to 50 coupons at once

// Query parameters for active coupons
export const ActiveCouponsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
});

// Export all schemas
export default {
  CreateCouponSchema,
  UpdateCouponSchema,
  ValidateCouponSchema,
  ApplyCouponSchema,
  BulkCreateCouponSchema,
  ActiveCouponsQuerySchema,
};