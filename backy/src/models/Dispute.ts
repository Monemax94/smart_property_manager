import { Schema, model, Document, Types } from 'mongoose';
import { FileInfo, FileInfoSchema } from './File';
import { generateSequentialId } from '../utils/id.generator';

export enum DisputeStatus {
    PENDING = "PENDING",
    RESOLVED = "RESOLVED",
    INVESTIGATING = "INVESTIGATING",
    REJECTED = "REJECTED",
}


export interface IDisputeResponse {
    responder: Types.ObjectId;
    responseMessage: string;
    attachments?: FileInfo[];
    respondedAt: Date;
}

export interface IDispute extends Document {
    raisedOn: Date;
    currentStatus: DisputeStatus;
    lastUpdated: Date;
    reason: string;
    disputeId: string;
    description: string;
    isDeleted: boolean;
    attachments: FileInfo[];
    order: Types.ObjectId;
    raisedBy: Types.ObjectId;
    responses: IDisputeResponse[];
}

// Define subdocument schema for responses
const ResponseSchema = new Schema<IDisputeResponse>(
    {
        responder: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        responseMessage: { type: String, required: true },
        attachments: [{ type: String }],
        respondedAt: { type: Date, default: Date.now }
    },
);

const DisputeSchema = new Schema<IDispute>(
    {
        raisedOn: { type: Date, default: Date.now },
        currentStatus: {
            type: String,
            enum: Object.values(DisputeStatus),
            default: DisputeStatus.PENDING
        },
        lastUpdated: { type: Date, default: Date.now },
        reason: { type: String, required: true },
        disputeId: { type: String },
        description: { type: String, required: true },
        isDeleted: { type: Boolean, default: false },
        attachments: { type: [FileInfoSchema], default: [] },
        order: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
        raisedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        responses: [ResponseSchema]
    },
    { timestamps: true }
);

DisputeSchema.pre('save', async function (next) {
    if (!this.isNew) return next();
    try {
        this.disputeId = await generateSequentialId(DisputeModel, 'DIS');
        next();
    } catch (err: any) {
        next(err);
    }
});

export const DisputeModel = model<IDispute>('Dispute', DisputeSchema);