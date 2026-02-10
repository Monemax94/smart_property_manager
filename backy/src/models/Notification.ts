import { Schema, model, Document } from 'mongoose';

export enum NotificationStatus {
    PENDING = 'Pending',
    PAUSED = 'Paused',
    SENT = 'Sent',
    DRAFT = 'Draft',
    PUBLISHED = 'Published',
    EXPIRED = 'Expired',
}


export enum NotificationType {
    SCHEDULED = 'Scheduled',
    TRIGGERED = 'Triggered',
    DRAFT = 'Draft',
}

export enum RecipientType {
    ALL_VENDORS = 'All Vendors',
    BUYERS = 'Buyers',
    CUSTOMERS = 'Customers',
    ADMIN = 'Admin',
    SUPER_ADMIN = 'Super Admin',
    VENDORS_BUYER = 'All Vendors & Buyers',
    VENDOR_BUYER = 'Vendor & Buyers',
}

export enum NotificationFrequency {
    NO_REPEAT = 'No Repeat',
    DAILY = 'Daily',
    WEEKLY = 'Weekly',
    MONTHLY = 'Monthly',
    YEARLY = 'Yearly',
}

export enum TriggerEventType {
    ORDER_PLACED = 'Order Placed',
    ORDER_DELIVERED = 'Order Delivered',
    PRODUCT_CREATED = 'Product Created',
    PRODUCT_UPDATED = 'Product Updated',
    USER_REGISTERED = 'User Registered',
    USER_LOGGED_IN = 'User Logged In',
    PAYMENT_RECEIVED = 'Payment Received',
    SUPPORT_TICKET_CREATED = 'Support Ticket Created',
    REVIEW_SUBMITTED = 'Review Submitted',
    CART_ABANDONED = 'Cart Abandoned',
}

export interface INotification extends Document {
    title: string;
    content: string;
    recipients: RecipientType[];
    type: NotificationType;
    scheduleDate?: Date;
    frequency?: NotificationFrequency;
    triggerEvent?: TriggerEventType;
    published: boolean;
    clicks: string[];
    status: NotificationStatus;
    createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
    {
        title: { type: String, required: true },
        content: { type: String, required: true },
        recipients: [{
            type: String,
            enum: Object.values(RecipientType),
            required: true
        }],
        type: {
            type: String,
            enum: Object.values(NotificationType),
            required: true,
        },
        scheduleDate: {
            type: Date,
        },
        frequency: {
            type: String,
            enum: Object.values(NotificationFrequency),
        },
        triggerEvent: {
            type: String,
            enum: Object.values(TriggerEventType),
        },
        published: {
            type: Boolean,
            default: false,
        },
        clicks: {
            type: [String],
            default: [],
          },
          status: {
            type: String,
            enum: Object.values(NotificationStatus),
            default: NotificationStatus.PENDING,
          },
    },
    { timestamps: true }
);

export const NotificationModel = model<INotification>('Notification', NotificationSchema);