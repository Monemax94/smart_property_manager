import { IUserDocument } from "../models/User";

export interface ITwoFactorSecret {
    secret: string;
    qrCodeUrl: string;
    manualEntryKey: string;
}

export interface IVerifyTokenResult {
    verified: boolean;
    message: string;
}

export interface ITwoFactorRepository {
    findUserById(userId: string): Promise<IUserDocument | null>;
    updateUser(userId: string, updates: Partial<IUserDocument>): Promise<IUserDocument | null>;
    saveTwoFactorSecret(userId: string, secret: string): Promise<boolean>;
    getTwoFactorSecret(userId: string): Promise<string | null>;
    enableTwoFactor(userId: string): Promise<boolean>;
    disableTwoFactor(userId: string): Promise<boolean>;
}

export interface ITwoFactorService {
    generateSecret(userId: string, email: string): Promise<ITwoFactorSecret>;
    verifyToken(userId: string, token: string): Promise<IVerifyTokenResult>;
    enableTwoFactor(userId: string, token: string): Promise<IVerifyTokenResult>;
    disableTwoFactor(userId: string, token: string): Promise<IVerifyTokenResult>;
    checkTwoFactorStatus(userId: string): Promise<boolean>;
}