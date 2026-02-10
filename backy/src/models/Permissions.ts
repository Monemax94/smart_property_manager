import { Schema, model, Document } from 'mongoose';

export enum AccessLevel {
  FULL = 'full',
  RESTRICTED = 'restricted',
  CREATE = 'create',
  DELETE = 'delete',
  UPDATE = 'update',
  NONE = 'none',
}

export type UserPermissionInput = {
  user: string;
  permissions: {
    permission: string;
    accessLevel: AccessLevel[];
  }[];
};


export interface IPermission extends Document {
  module: string;
  isDeleted: boolean;
  accessLevel: AccessLevel[];
}

const permissionSchema = new Schema<IPermission>(
  {
    module: { type: String, required: true },
    isDeleted: {type: Boolean, default: false},
    accessLevel: {
      type: [String],
      enum: Object.values(AccessLevel),
      default: [AccessLevel.NONE],
    },
  },
  { timestamps: true }
);

export const PermissionModel = model<IPermission>('Permission', permissionSchema);
