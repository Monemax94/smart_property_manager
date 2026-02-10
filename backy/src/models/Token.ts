import { Schema, model, Document, Types } from 'mongoose';
import { TOKEN_EXPIRY_MINUTES } from '../secrets';
const EXPIRY_MINUTES = Number(TOKEN_EXPIRY_MINUTES || 10);
const EXPIRY_SECONDS = EXPIRY_MINUTES * 60;
export interface IToken extends Document {
  user?: Types.ObjectId;
  email?: string;
  token: number;
  used?: boolean;
  usedAt?: Date;
  createdAt: Date;
}

const tokenSchema = new Schema<IToken>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: false },
  email: { type: String, required: false },
  used: { type: Boolean, default: false },
  token: { type: Number, required: true },
   // 👇 TTL index uses env value
   createdAt: {
    type: Date,
    default: Date.now,
    expires: EXPIRY_SECONDS,
  },
  usedAt: { type: Date},
});

export const TokenModel = model<IToken>('Token', tokenSchema);
