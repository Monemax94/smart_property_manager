import Joi from "joi";
import { DisputeStatus } from "../models/Dispute";
import { fileInfoSchema } from "./fileValidation";

export const createDisputeSchema = Joi.object({
  // disputeId: Joi.string().required(),
  reason: Joi.string().required(),
  description: Joi.string().required(),
  order: Joi.string().required(),
  // raisedBy: Joi.string().required(),
  uploadedFiles: Joi.array().items(fileInfoSchema).default([]),
});

export const disputeQuerySchema =Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  status: Joi.string().valid(...Object.values(DisputeStatus)).optional(),
  userId: Joi.string().hex().length(24).optional(),
  type: Joi.string().optional(),
  query: Joi.string().optional()
});

export const updateDisputeStatusSchema = Joi.object({
  status: Joi.string().valid(...Object.values(DisputeStatus)).required(),
});

export const respondToDisputeSchema = Joi.object({
  // responder: Joi.string().required(),
  responseMessage: Joi.string().required(),
  attachments: Joi.array().items(
    Joi.object({
      filename: Joi.string().required(),
      filePath: Joi.string().required(),
      mimetype: Joi.string().required(),
    }).optional()
  ),
});
