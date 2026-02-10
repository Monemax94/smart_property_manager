import { Schema, model, Document, Types } from 'mongoose';


export interface ICurrencyCode extends Document {
  countryCode: string;
  country: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export const CurrencySchema = new Schema<ICurrencyCode>({

  countryCode: {
    type: String,
    unique: true
  },
  country: {
    type: String,
    unique: true
  },
}, { timestamps: true });


export const CurrencySchemaModel = model<ICurrencyCode>('CurrencyCode', CurrencySchema);