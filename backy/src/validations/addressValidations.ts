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
  street: Joi.string().optional().max(100).allow('', null),
  city: Joi.string().optional().max(50).allow('', null),
  firstName: Joi.string().required().max(50),
  lastName: Joi.string().required().max(50),
  state: Joi.string().optional().max(50).allow('', null),
  postalCode: Joi.string().optional().max(20).allow('', null),
  country: Joi.string().optional().max(50).allow('', null),
  isDefault: Joi.boolean().default(false),
  additionalInfo: Joi.string().max(500).optional().allow('', null),
  phoneNumber: Joi.string().pattern(/^\+?[0-9]{10,15}$/).optional().allow('', null),
  additionalPhoneNumber: Joi.string().pattern(/^\+?[0-9]{10,15}$/).optional().allow('', null)
});

export const updateAddressSchema = Joi.object<UpdateAddressDto>({
  type: Joi.string().valid(...Object.values(AddressType)).optional(),
  street: Joi.string().max(100).optional().allow('', null),
  firstName: Joi.string().max(100).optional().allow('', null),
  lastName: Joi.string().max(100).optional().allow('', null),
  city: Joi.string().max(50).optional().allow('', null),
  state: Joi.string().max(50).optional().allow('', null),
  postalCode: Joi.string().max(20).optional().allow('', null),
  country: Joi.string().max(50).optional().allow('', null),
  isDefault: Joi.boolean().optional(),
  additionalInfo: Joi.string().max(500).optional().allow('', null),
  phoneNumber: Joi.string().pattern(/^\+?[0-9]{10,15}$/).optional().allow('', null),
  additionalPhoneNumber: Joi.string().pattern(/^\+?[0-9]{10,15}$/).optional().allow('', null)
}).min(1);