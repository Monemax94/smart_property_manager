import Joi from 'joi';
import {
  NotificationFrequency,
  NotificationStatus,
  NotificationType,
  RecipientType,
  TriggerEventType
} from '../models/Notification';

export const createNotificationSchema = Joi.object({
  title: Joi.string().required(),
  content: Joi.string().required(),
  recipients: Joi.array().items(Joi.string().valid(...Object.values(RecipientType))).required(),
  type: Joi.string().valid(...Object.values(NotificationType)).required(),
  scheduleDate: Joi.date().when('type', {
    is: NotificationType.SCHEDULED,
    then: Joi.required()
  }),
  frequency: Joi.string().valid(...Object.values(NotificationFrequency)).when('type', {
    is: NotificationType.SCHEDULED,
    then: Joi.required(),

  }),
  triggerEvent: Joi.string().valid(...Object.values(TriggerEventType)).when('type', {
    is: NotificationType.TRIGGERED,
    then: Joi.required(),

  }),
});


export const bulkUpdateStatusSchema = Joi.object({
  notificationIds: Joi.array()
    .items(
      Joi.string()
        .required()
        .messages({
          'string.empty': 'Notification ID cannot be empty',
          'any.required': 'Notification ID is required'
        })
    )
    .min(1)
    .required()
    .messages({
      'array.base': 'notificationIds must be an array',
      'array.min': 'At least one notification ID is required',
      'any.required': 'notificationIds are required'
    }),
  status: Joi.string()
    .valid(...Object.values(NotificationStatus))
    .required()
    .messages({
      'any.only': `status must be one of: ${Object.values(NotificationStatus).join(', ')}`,
      'any.required': 'status is required',
      'string.empty': 'status cannot be empty'
    })
});
export const updateNotificationSchema = createNotificationSchema.fork(['title', 'content'], (field) => field.optional());
