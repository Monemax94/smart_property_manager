import { Request } from 'express';
import { IUserDocument, UserRole } from '../models/User';

export type JWTPayload = {
  _id: string;
  role: UserRole;
  email: string;
};

export interface AuthenticatedRequest extends Request {
  user: IUserDocument;
  files: {
    [fieldname: string]: Express.Multer.File[];
  };
  params: {
    [key: string]: string | undefined;
  };
}

export interface CloudinaryFile extends Express.Multer.File {
  buffer: Buffer;
}

export enum MailType {
  RESET = "RESET",
  CREATE = "CREATE"
}
export enum TokenType {
  EMAIL = "EMAIL",
  PHONE = "PHONE",
  PASSWORD = "PASSWORD",
  PASSWORD_RESET_EMAIL = "PASSWORD_RESET_EMAIL",
  PASSWORD_RESET_PHONE = "PASSWORD_RESET_PHONE",
  ACCOUNT_RECOVERY = "ACCOUNT_RECOVERY",
  TRANSACTION_PIN = "TRANSACTION_PIN"
}