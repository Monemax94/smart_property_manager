import { Schema, model, Types, Document } from 'mongoose';
import bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import { IProfileDocument } from './Profile';
import { IVendor } from './Vendor';

export enum UserRole {
    CUSTOMER = 'tenant',
    VENDOR = 'vendor',
    ADMIN = 'admin',
    SUPER_ADMIN = 'superadmin'
}

export enum UserStatus {
    ACTIVE = 'active',
    IDLE = 'idle',
    OFFLINE = 'offline'
}

export enum ActionType {
    UNAUTHORIZED_ACCESS_ATTEMPT = 'UNAUTHORIZED_ACCESS_ATTEMPT',
    AUTHENTICATE = 'AUTHENTICATE',
    AUTHORIZED_ACCESS = 'AUTHORIZED_ACCESS'
}

export interface ILoginSession {
    timestamp: Date;
    ipAddress: string;
    userAgent: string;
    deviceId?: string;
    location?: {
        country: string;
        city: string;
    };
    sessionToken: string;
    expiresAt: Date;
}

export interface IUser {
    email: string;
    recoveryEmail?: string;
    phoneNumber?: string;
    password?: string;
    securityQuestion?: string;
    securityAnswer?: string;
    googleId?: string;
    hint?: string;
    userID: string;
    role: UserRole;
    status: UserStatus;
    verified: boolean;
    twoFactorEnabled: boolean;
    profile: Types.ObjectId | IProfileDocument;
    vendor: Types.ObjectId | IVendor
    isActive: boolean;
    isDeleted: boolean;
    loginHistory: ILoginSession[];
    currentSessions: Types.ObjectId[];
    lastActiveAt: Date;
    activityLog: {
        timestamp: Date;
        action: ActionType;
        endpoint?: string;
    }[];
    deactivatedBy?: Types.ObjectId;
    whyShopHere?: string[];
    interests?: string[];
    transactionPin?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface IUserDocument extends IUser, Document<Types.ObjectId> {
    comparePassword(candidate: string): Promise<boolean>;
    compareSecurityAnswer(candidate: string): Promise<boolean>;
    isCurrentlyActive(windowMinutes?: number): Promise<boolean>;
}

const loginSessionSchema = new Schema<ILoginSession>({
    timestamp: { type: Date, default: Date.now },
    ipAddress: String,
    userAgent: String,
    deviceId: String,
    location: {
        country: String,
        city: String
    },
    sessionToken: { type: String, required: true },
    expiresAt: { type: Date, required: false }
}, { _id: false });

const activityLogSchema = new Schema({
    timestamp: { type: Date, default: Date.now },
    action: {
        type: String,
        enum: Object.values(ActionType),
    },
    endpoint: String
}, { _id: false });

const userSchema = new Schema<IUserDocument>(
    {
        // email: { type: String, required: true, unique: true, index: true },
        email: { type: String, required: true },
        // recoveryEmail: { type: String, unique: true, sparse: true },
        recoveryEmail: { type: String, sparse: true },
        phoneNumber: {
            type: String,
            // unique: true,
            default: undefined,
            trim: true,
            // sparse: true,
            required: false,
        },
        password: { type: String, required: false },
        twoFactorEnabled: { type: Boolean, default: false },
        securityQuestion: { type: String },
        hint: { type: String },
        googleId: { type: String, sparse: true, unique: true },
        securityAnswer: { type: String },
        whyShopHere: [{ type: String }],
        interests: [{ type: String }],
        profile: { type: Schema.Types.ObjectId, ref: 'Profile' },
        vendor: { type: Schema.Types.ObjectId, ref: 'Vendor' },
        role: {
            type: String,
            enum: Object.values(UserRole),
            default: UserRole.CUSTOMER,
            index: true
        },
        status: {
            type: String,
            enum: Object.values(UserStatus),
            default: UserStatus.OFFLINE
        },
        userID: { type: String, unique: true, index: true },
        verified: { type: Boolean, default: false },
        isActive: { type: Boolean, default: true, index: true },
        isDeleted: { type: Boolean, default: false },
        loginHistory: [loginSessionSchema],
        currentSessions: [{ type: Schema.Types.ObjectId, ref: 'Session' }],
        lastActiveAt: { type: Date, index: true },
        activityLog: [activityLogSchema],
        deactivatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        transactionPin: {
            type: String,
            select: false,
          }
          
    },
    {
        timestamps: true,
        statics: {
            async getActiveUsersCount(windowMinutes: number = 30): Promise<number> {
                const cutoff = new Date(Date.now() - windowMinutes * 60 * 1000);
                return this.countDocuments({
                    isActive: true,
                    isDeleted: false,
                    $or: [
                        { lastActiveAt: { $gte: cutoff } },
                        { status: UserStatus.ACTIVE }
                    ]
                });
            }
        }
    }
);

userSchema.pre('save', async function (next) {
    const user = this as IUserDocument;

    try {
        // Clean phoneNumber: convert empty string or null to undefined
        if (!user.phoneNumber || user.phoneNumber === '' || user.phoneNumber === null) {
            user.phoneNumber = undefined;
        }

        // Trim phoneNumber if it exists
        if (user.phoneNumber) {
            user.phoneNumber = user.phoneNumber.trim();
        }


        // Password hashing
        if (user.isModified('password')) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
        }

        // Security answer encryption
        if (user.isModified('securityAnswer') && user.securityAnswer) {
            const salt = await bcrypt.genSalt(10);
            user.securityAnswer = await bcrypt.hash(user.securityAnswer, salt);
        }
        // Generate userID only if not already set
        if (user.isNew && !user.userID) {
            const prefixMap: Record<UserRole, string> = {
                [UserRole.CUSTOMER]: 'CUS',
                [UserRole.VENDOR]: 'VEN',
                [UserRole.ADMIN]: 'ADM',
                [UserRole.SUPER_ADMIN]: 'SUP'
            };

            let uniqueID = '';
            let isUnique = false;

            while (!isUnique) {
                const randomPart = Math.floor(10000000 + Math.random() * 90000000).toString(); // 8 digits
                const suffix = crypto.randomBytes(1).toString('hex').toUpperCase(); // 2 hex chars
                const prefix = prefixMap[user.role] || 'USR';
                uniqueID = `${prefix}${randomPart}${suffix}`;

                const existing = await UserModel.findOne({ userID: uniqueID });
                if (!existing) isUnique = true;
            }

            user.userID = uniqueID;
        }

        next();
    } catch (err) {
        next(err as Error);
    }
});

// Instance method to check password
userSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
    return bcrypt.compare(candidate, this.password);
};

// Instance method to check security answer
userSchema.methods.compareSecurityAnswer = async function (candidate: string): Promise<boolean> {
    if (!this.securityAnswer) return false;
    return bcrypt.compare(candidate, this.securityAnswer);
};

// Instance method to check active status
userSchema.methods.isCurrentlyActive = async function (windowMinutes: number = 30): Promise<boolean> {
    const cutoff = new Date(Date.now() - windowMinutes * 60 * 1000);
    return this.status === UserStatus.ACTIVE || this.lastActiveAt >= cutoff;
};
// Add partial index for phoneNumber
userSchema.index({ phoneNumber: 1 }, {
    unique: true,
    partialFilterExpression: {
        phoneNumber: { $type: 'string', $ne: null }
    }
});
// Indexes for performance
userSchema.index({ lastActiveAt: 1, role: 1, isActive: 1 });
userSchema.index({ status: 1, isActive: 1 });
userSchema.index({ interests: 1 }); // Index for interests
userSchema.index({ whyShopHere: 1 }); // Index for whyShopHere

export const UserModel = model<IUserDocument>('User', userSchema);