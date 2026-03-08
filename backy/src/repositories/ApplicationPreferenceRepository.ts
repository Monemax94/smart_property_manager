import { injectable } from 'inversify';
import ApplicationPreference, { IApplicationPreference } from '../models/ApplicationPreferences';
import mongoose, { Types } from 'mongoose';

@injectable()
export class ApplicationPreferenceRepository {
    async findByUserId(userId: string): Promise<IApplicationPreference | null> {
        return ApplicationPreference.findOne({ user: userId });
    }

    async createDefaultPreferences(
        userId: string
    ): Promise<IApplicationPreference> {
        return ApplicationPreference.findOneAndUpdate(
            { user: userId },
            { $setOnInsert: { user: userId } },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        ) as unknown as IApplicationPreference;
    }
    
    async updatePreferences(
        userId: Types.ObjectId,
        updateData: Partial<IApplicationPreference>
    ): Promise<IApplicationPreference> {
        return ApplicationPreference.findOneAndUpdate(
            { user: userId },

            {
                $set: updateData,
                $setOnInsert: {
                    user: userId
                }
            },

            {
                new: true,
                upsert: true,
                runValidators: true,
                setDefaultsOnInsert: true
            }
        );
    }

}