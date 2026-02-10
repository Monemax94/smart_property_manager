import { Schema, model, Document, Types } from 'mongoose';
import { AccessLevel } from './Permissions';

export interface IUserPermission extends Document {
  user: Types.ObjectId;
  permissions: {
    permission: Types.ObjectId;
    accessLevel: AccessLevel[];
  }[];
}

const userPermissionSchema = new Schema<IUserPermission>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    permissions: [
      {
        permission: {
          type: Schema.Types.ObjectId,
          ref: 'Permission',
          required: true,
        },
        accessLevel: {
          type: [String],
          enum: Object.values(AccessLevel),
          default: [AccessLevel.NONE]
        } 
      },
    ],
  },
  { timestamps: true }
);

export const UserPermissionModel = model<IUserPermission>('UserPermission', userPermissionSchema);
