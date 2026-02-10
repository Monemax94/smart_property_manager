import Joi from 'joi';
import { AddressType } from '../models/Address';

export interface CreateAddressDto {
  userId: string;
  type: AddressType;
  street?: string;
  firstName: string;
  lastName: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  isDefault?: boolean;
  additionalInfo?: string;
  phoneNumber?: string;
  additionalPhoneNumber?: string;
}

export interface UpdateAddressDto {
  type?: AddressType;
  street?: string;
  city?: string;
  state?: string;
  firstName?: string;
  lastName?: string;
  postalCode?: string;
  country?: string;
  isDefault?: boolean;
  additionalInfo?: string;
  additionalPhoneNumber?: string;
  phoneNumber?: string;
}
export const defaultAddressQuerySchema = Joi.object({
  type: Joi.string()
    .valid(...Object.values(AddressType))
    .messages({
      'any.only': `Type must be one of: ${Object.values(AddressType).join(', ')}`
    })
});
export const createAddressSchema = Joi.object<CreateAddressDto>({
  type: Joi.string().valid(...Object.values(AddressType)).required(),
  street: Joi.string().optional().max(100),
  city: Joi.string().optional().max(50),
  firstName: Joi.string().required().max(50),
  lastName: Joi.string().required().max(50),
  state: Joi.string().optional().max(50),
  postalCode: Joi.string().optional().max(20),
  country: Joi.string().optional().max(50),
  isDefault: Joi.boolean().default(false),
  additionalInfo: Joi.string().max(500).optional(),
  phoneNumber: Joi.string().pattern(/^\+?[0-9]{10,15}$/).optional(),
  additionalPhoneNumber: Joi.string().pattern(/^\+?[0-9]{10,15}$/).optional()
});

export const updateAddressSchema = Joi.object<UpdateAddressDto>({
  type: Joi.string().valid(...Object.values(AddressType)).optional(),
  street: Joi.string().max(100).optional(),
  firstName: Joi.string().max(100).optional(),
  lastName: Joi.string().max(100).optional(),
  city: Joi.string().max(50).optional(),
  state: Joi.string().max(50).optional(),
  postalCode: Joi.string().max(20).optional(),
  country: Joi.string().max(50).optional(),
  isDefault: Joi.boolean().optional(),
  additionalInfo: Joi.string().max(500).optional(),
  phoneNumber: Joi.string().pattern(/^\+?[0-9]{10,15}$/).optional(),
  additionalPhoneNumber: Joi.string().pattern(/^\+?[0-9]{10,15}$/).optional()
}).min(1);