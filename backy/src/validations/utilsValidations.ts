import Joi from 'joi';
import mongoose from 'mongoose';

export const objectIdValidator = (value: string, helpers: Joi.CustomHelpers) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      return helpers.error('any.invalid');
    }
    return value;
  };