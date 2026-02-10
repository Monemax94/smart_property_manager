import { Schema, model, Document } from 'mongoose';

export interface IOrganization extends Document {
    name: string;
    slug: string;
    displayName: string;
    launchDate?: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}


export interface IWaitlist extends Document {
    name: string;
    email: string;
    phone?: string;
    organization: Schema.Types.ObjectId;
    joinedAt: Date;
    notifiedAt?: Date;
    meta?: Record<string, any>;
}


export type CreateWaitlistDTO = {
    name: string;
    email: string;
    phone?: string;
    organizationSlug: string;
    meta?: Record<string, any>;
};

const WaitlistSchema = new Schema<IWaitlist>({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    organization: {
        type: Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },
    joinedAt: { type: Date, default: Date.now },
    notifiedAt: { type: Date },
    meta: { type: Schema.Types.Mixed }
});

// Index for faster queries by organization
WaitlistSchema.index({ organization: 1, email: 1 }, { unique: true });


const OrganizationSchema = new Schema<IOrganization>({
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    displayName: { type: String, required: true },
    launchDate: { type: Date },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

export const OrganizationModel = model<IOrganization>('Organization', OrganizationSchema);
export const WaitlistModel = model<IWaitlist>('Waitlist', WaitlistSchema);