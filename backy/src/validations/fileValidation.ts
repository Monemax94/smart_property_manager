import Joi from "joi/lib";

export const fileInfoSchema = Joi.object({
    url: Joi.string().uri().required(),
    fileSize: Joi.number().min(1).required(),
    fileType: Joi.string(),
    format: Joi.string().required(),
    publicId: Joi.string().required(),
    imageName: Joi.string().optional(),
    documentName: Joi.string().valid('businessRegistration', 'vendorNIN', 'storeLogo').optional(),
});
// example usage 
// uploadedFiles: Joi.array().items(fileInfoSchema).default([]),