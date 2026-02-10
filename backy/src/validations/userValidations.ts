import Joi from 'joi';
import { UserRole } from '../models/User';
import { fileInfoSchema } from "./fileValidation"
import { objectIdValidator } from './utilsValidations';
import { AccessLevel, PermissionModel } from '../models/Permissions';
import mongoose from 'mongoose';
import { CountryCode } from '../models/Vendor';

// ISO-2 country code (Stripe requirement)
export const countryCodeSchema = Joi.string()
  .valid(...Object.values(CountryCode))
  .required()
  .messages({
    'any.only': 'Country must be a supported ISO-2 code (e.g. NG, US, GB)',
    'any.required': 'Country code is required'
  });

const dobSchema = Joi.date()
  .iso()
  .less('now')
  .messages({
    'date.base': 'Date of birth must be a valid date',
    'date.format': 'Date of birth must be in ISO format (YYYY-MM-DD)',
    'date.less': 'Date of birth must be in the past',
    'any.required': 'Date of birth is required'
  });

const baseAccountSchema = {

  email: Joi.string()
    .trim()
    .lowercase()
    .email({ tlds: { allow: false } })
    .required(),

  phoneNumber: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .optional(),

  firstName: Joi.string().trim().min(2).required(),
  lastName: Joi.string().trim().min(2).required(),

  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/)
    .required()
    .messages({
      'string.pattern.base':
        'Password must contain at least one uppercase, lowercase, number, and special character'
    }),

  role: Joi.string()
    .valid(...Object.values(UserRole))
};

// Base user validation schema
export const userBaseSchema = Joi.object({
  ...baseAccountSchema,
  dob: dobSchema.optional(),
  role: Joi.string()
    .valid(...Object.values(UserRole))
    .default(UserRole.CUSTOMER)
});

export const vendorBaseSchema = Joi.object({
  ...baseAccountSchema,
  dob: dobSchema.required(),
  role: Joi.string()
    .valid(UserRole.VENDOR)
    .default(UserRole.VENDOR)
    .strip()
});


export const loginSchema = Joi.object({
  email: Joi.string()
    .trim()
    .lowercase()
    .email({ tlds: { allow: false } })
    .required(),
  password: Joi.string()
    .min(8)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])'))
    .required()
    .messages({
      'string.pattern.base': 'Password must contain at least one uppercase, lowercase, number, and special character'
    })
});
export const userVerifySchema = Joi.object({
  email: Joi.string()
    .trim()
    .lowercase()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      'string.base': 'Email should be a string',
      'string.email': 'Please enter a valid email address',
      'any.required': 'Email is required'
    }),
  token: Joi.string().length(6).pattern(/^[0-9]+$/).required()
    .messages({
      'string.base': 'Token should be a string',
      'string.length': 'Token must be exactly 6 digits',
      'string.pattern': 'Token must contain only numbers',
      'any.required': 'Token is required'
    })
});
export const forgotSchema = Joi.object({
  email: Joi.string()
    .trim()
    .lowercase()
    .email({ tlds: { allow: false } })
    .required(),
  token: Joi.string().length(6).required(),
  securityAnswer: Joi.string().optional(),
  newPassword: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*\W).+$/)
    .required()
    .messages({
      'string.pattern.base': 'newPassword must include uppercase, lowercase, number & special char'
    }),
})
export const forgotEmailSchema = Joi.object({
  email: Joi.string()
    .trim()
    .lowercase()
    .email({ tlds: { allow: false } })
    .required(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required()
});

export const TokenValidationSchema = Joi.object({
  email: Joi.string()
    .trim()
    .lowercase()
    .email({ tlds: { allow: false } })
    .required(),
  token: Joi.string().length(6).required()
})
export const LogoutValidationSchema = Joi.object({
  token: Joi.string().required()
})

export const addressSchema = Joi.object({
  street: Joi.string().required(),
  city: Joi.string().required(),
  state: Joi.string().required(),
  postalCode: Joi.string().required(),
  country: Joi.string().required()
});
// Vendor-specific validation schema
export const vendorProfileSchema = Joi.object({
  email: Joi.string()
    .trim()
    .lowercase()
    .email({ tlds: { allow: false } })
    .required(),
  storeName: Joi.string().required().min(3).max(100),
  storeDescription: Joi.string().min(10).max(500).optional(),
  uploadedFiles: Joi.array().items(fileInfoSchema).default([]),
  taxId: Joi.string().required().pattern(/^[A-Za-z0-9\-]+$/),
  nin: Joi.string().optional(),
  categories: Joi.array()
    .items(Joi.string().custom(objectIdValidator, 'ObjectId validation'))
    .required()
    .messages({
      'array.base': 'whatYouSell must be an array of valid category IDs',
      'any.invalid': 'Each item in whatYouSell must be a valid Mongo ObjectId',
    }),

  address: Joi.object({
    street: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    postalCode: Joi.string().required(),
    country: Joi.string().required()
  }).required(),
  website: Joi.string().uri().lowercase().optional(),
  // ISO-2 country code (Stripe requirement)
  countryCode: Joi.string().required()
  // countryCode: countryCodeSchema
});
export const updateVendorProfileSchema = Joi.object({
  storeName: Joi.string().min(3).max(100).optional(),
  storeDescription: Joi.string().min(10).max(500).optional(),
  uploadedFiles: Joi.array().items(fileInfoSchema).default([]),
  taxId: Joi.string().pattern(/^[A-Za-z0-9\-]+$/).optional(),
  nin: Joi.string().optional(),
  categories: Joi.array()
    .items(Joi.string().custom(objectIdValidator, 'ObjectId validation'))
    .optional()
    .messages({
      'array.base': 'Categories must be an array of valid category IDs',
      'any.invalid': 'Each item in categories must be a valid Mongo ObjectId',
    }),
  address: Joi.object({
    street: Joi.string().optional(),
    city: Joi.string().optional(),
    state: Joi.string().optional(),
    postalCode: Joi.string().optional(),
    country: Joi.string().optional()
  }).optional(),
  website: Joi.string().uri().lowercase().optional(),
  // ISO-2 country code (Stripe requirement)
  countryCode: Joi.string().required()
});

export const createVendorSchema = userBaseSchema.concat(vendorProfileSchema);


export const VerificationSchema = Joi.object({
  vendorsId: Joi.array().items(Joi.string()).required()
});

export const FlaggingSchema = Joi.object({
  vendorsId: Joi.array().items(Joi.string()).required(),
  reason: Joi.string().max(500).required(),
  uploadedFiles: Joi.array().items(fileInfoSchema).default([])
});

export const blacklistSchema = Joi.object({
  blacklisted: Joi.boolean().required(),
  reason: Joi.when('blacklisted', {
    is: true,
    then: Joi.string().min(10).max(500).required().messages({
      'string.min': 'Reason must be at least 10 characters when blacklisting',
      'any.required': 'Reason is required when blacklisting a vendor'
    }),
    otherwise: Joi.string().max(500).optional()
  })
});

export const revokeSchema = Joi.object({
  revoked: Joi.boolean().required(),
  vendorsId: Joi.array().items(Joi.string().required()).min(1).required(),
  reason: Joi.when('revoked', {
    is: true,
    then: Joi.string().min(10).max(500).required().messages({
      'string.min': 'Reason must be at least 10 characters when revoking verification',
      'any.required': 'Reason is required when revoking verification'
    }),
    otherwise: Joi.string().max(500).optional()
  })
});

export const resetPasswordSchema = Joi.object({
  oldPassword: Joi.string().required().messages({
    "string.empty": "Old password is required"
  }),
  newPassword: Joi.string()
    .min(8)
    .required()
    .messages({
      "string.min": "Password must be at least 8 characters long",
      "string.empty": "Password is required"
    }),
  confirmPassword: Joi.any()
    .valid(Joi.ref("newPassword"))
    .required()
    .messages({
      "any.only": "Passwords do not match",
      "any.required": "Confirm password is required"
    })
});



// Joi validation schema for update preferences and security settings
export const updateUserSettingsSchema = Joi.object({
  email: Joi.string()
    .trim()
    .lowercase()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'string.empty': 'Email address is required',
      'any.required': 'Email address is required'
    }),
  whyShopHere: Joi.array().items(Joi.string().trim().max(100)).optional().messages({
    'array.base': 'whyShopHere must be an array of strings',
    'string.max': 'Each whyShopHere item must be less than 100 characters'
  }),
  interests: Joi.array().items(Joi.string().trim().max(100)).optional().messages({
    'array.base': 'interests must be an array of strings',
    'string.max': 'Each interest item must be less than 100 characters'
  })
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
})


// Joi validation schema for update preferences and security settings
export const registerRecoveryEmailSchema = Joi.object({
  email: Joi.string()
    .trim()
    .lowercase()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'string.empty': 'Email address is required',
      'any.required': 'Email address is required'
    }),

  recoveryEmail: Joi.string()
    .trim()
    .lowercase()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'string.empty': 'Email address is required',
      'any.required': 'Email address is required'
    }),
  token: Joi.string().length(6).pattern(/^[0-9]+$/).required()
    .messages({
      'string.base': 'Token should be a string',
      'string.length': 'Token must be exactly 6 digits',
      'string.pattern': 'Token must contain only numbers',
      'any.required': 'Token is required'
    })
})


export const registerSecurityQuestion = Joi.object({
  email: Joi.string()
    .trim()
    .lowercase()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'string.empty': 'Email address is required',
      'any.required': 'Email address is required'
    }),
  securityQuestion: Joi.string().trim().min(5).max(200).optional().messages({
    'string.min': 'Security question must be at least 5 characters long',
    'string.max': 'Security question must be less than 200 characters',
    'string.empty': 'Security question cannot be empty'
  }),
  securityAnswer: Joi.string().trim().min(2).max(100).optional().messages({
    'string.min': 'Security answer must be at least 2 characters long',
    'string.max': 'Security answer must be less than 100 characters',
    'string.empty': 'Security answer cannot be empty'
  }),
  hint: Joi.string().trim().max(200).optional().messages({
    'string.max': 'Hint must be less than 200 characters'
  })
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
}).custom((value, helpers) => {
  // Custom validation: securityAnswer requires securityQuestion and vice versa
  const { securityQuestion, securityAnswer } = value;

  if (securityQuestion && !securityAnswer) {
    return helpers.error('any.required', {
      message: 'securityAnswer is required when securityQuestion is provided'
    });
  }

  if (securityAnswer && !securityQuestion) {
    return helpers.error('any.required', {
      message: 'securityQuestion is required when securityAnswer is provided'
    });
  }
  return value;
});

export const adminSchema = Joi.object({
  email: Joi.string()
    .trim()
    .lowercase()
    .email({ tlds: { allow: false } })
    .required(),
  phoneNumber: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/)
    .optional()
    .messages({
      "string.pattern.base":
        "Password must contain at least one uppercase, lowercase, number, and special character",
    }),
  role: Joi.string().valid(UserRole.ADMIN).default(UserRole.ADMIN),
  permissions: Joi.array()
    .items(
      Joi.object({
        permission: Joi.string()
          .custom((value, helpers) => {
            if (!mongoose.Types.ObjectId.isValid(value)) {
              return helpers.error("any.invalid");
            }
            return value;
          })
          .required()
          .messages({
            "any.invalid": "Permission ID must be a valid ObjectId",
          }),
        accessLevel: Joi.array()
          .items(Joi.string().valid(...Object.values(AccessLevel)))
          .default([AccessLevel.FULL])
          .optional(),
      })
    )
    .default([])
    .external(async (permissions) => {
      if (!permissions.length) return;

      const ids = permissions.map((p) => p.permission);
      const count = await PermissionModel.countDocuments({
        _id: { $in: ids },
        isDeleted: false,
      });

      if (count !== ids.length) {
        throw new Error("Some provided permission IDs do not exist or are deleted.");
      }
    }),
});

export const setPinSchema = Joi.object({
  token: Joi.string().length(6).pattern(/^[0-9]+$/).required()
    .messages({
      'string.base': 'Token should be a string',
      'string.length': 'Token must be exactly 6 digits',
      'string.pattern': 'Token must contain only numbers',
      'any.required': 'Token is required'
    }),
  pin: Joi.string().pattern(/^\d{4}$/).required().messages({
    'string.pattern.base': 'PIN must be a 4-digit number'
  })
});