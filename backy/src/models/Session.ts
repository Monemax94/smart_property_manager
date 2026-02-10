import { Schema, model, Types, Document } from 'mongoose';

export interface ISession {
    userId: Types.ObjectId;
    token: string;
    ipAddress: string;
    userAgent: string;
    deviceInfo?: object;
    createdAt: Date;
}

export interface ISessionDocument extends ISession, Document<Types.ObjectId> {}

const sessionSchema = new Schema<ISessionDocument>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    token: { type: String, required: true, index: true },
    ipAddress: { type: String, required: true },
    userAgent: { type: String, required: true },
    deviceInfo: { type: Object },
}, { timestamps: true });

sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const SessionModel = model<ISessionDocument>('Session', sessionSchema);