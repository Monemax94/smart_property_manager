import { inject, injectable } from 'inversify';
import { Types } from "mongoose";
import { UserModel, UserStatus } from '../models/User';
import { SessionModel } from '../models/Session';


@injectable()
export class SessionService {

  private readonly ACTIVE_WINDOW_MINUTES = 30;


  async updateUserActivity(
    userId: Types.ObjectId,
    action: string,
    endpoint?: string,
    metadata?: {
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<void> {
    const updateData: any = {
      $set: {
        lastActiveAt: new Date(),
        status: UserStatus.ACTIVE
      },
      $push: {
        activityLog: {
          timestamp: new Date(),
          action,
          endpoint
        }
      }
    };

    if (metadata?.ipAddress) {
      updateData.$set['lastKnownIp'] = metadata.ipAddress;
    }

    await UserModel.findByIdAndUpdate(userId, updateData);
  }

  async handleUserLogin(userId: Types.ObjectId, sessionData: {
    ipAddress: string;
    userAgent: string;
    token: string;
  }): Promise<void> {
    const session = await SessionModel.create({
      userId,
      ...sessionData
    });

    await UserModel.findByIdAndUpdate(userId, {
      $set: { status: UserStatus.ACTIVE, online: true},
      $push: {
        loginHistory: {
          ...sessionData,
          sessionToken: session.token,
          timestamp: new Date()
        },
        currentSessions: session._id
      }
    });
  }

  async handleUserLogout(userId: Types.ObjectId, sessionToken: string): Promise<void> {
    await SessionModel.deleteOne({ token: sessionToken });

    const user = await UserModel.findById(userId);
    if (user && user.currentSessions.length === 0) {
      await UserModel.findByIdAndUpdate(userId, {
        $set: { status: UserStatus.OFFLINE, online: false}
      });
    }
  }

  async getActiveUsersCount(role?: string): Promise<number> {
    const query: any = {
      isActive: true,
      isDeleted: false,
      $or: [
        { lastActiveAt: { $gte: new Date(Date.now() - this.ACTIVE_WINDOW_MINUTES * 60 * 1000) } },
        { status: UserStatus.ACTIVE }
      ]
    };

    if (role) {
      query.role = role;
    }

    return UserModel.countDocuments(query);
  }
}