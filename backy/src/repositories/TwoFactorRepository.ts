import { ITwoFactorRepository } from "../interfaces/ITwoFactor";
import { IUserDocument, UserModel } from "../models/User";
import { injectable } from 'inversify';


@injectable()
export class TwoFactorRepository implements ITwoFactorRepository {
    async findUserById(userId: string): Promise<IUserDocument | null> {
        try {
            return await UserModel.findById(userId).select('+twoFactorSecret');
        } catch (error) {
            console.error('Error finding user:', error);
            throw new Error('Database error while finding user');
        }
    }

    async updateUser(userId: string, updates: Partial<IUserDocument>): Promise<IUserDocument | null> {
        try {
            return await UserModel.findByIdAndUpdate(
                userId,
                { $set: updates },
                { new: true }
            );
        } catch (error) {
            console.error('Error updating user:', error);
            throw new Error('Database error while updating user');
        }
    }

    async saveTwoFactorSecret(userId: string, secret: string): Promise<boolean> {
        try {
            const user = await UserModel.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Store the secret (you might want to encrypt this)
            user.set('twoFactorSecret', secret);
            await user.save();
            return true;
        } catch (error) {
            console.error('Error saving 2FA secret:', error);
            throw new Error('Failed to save 2FA secret');
        }
    }

    async getTwoFactorSecret(userId: string): Promise<string | null> {
        try {
            const user = await UserModel.findById(userId).select('+twoFactorSecret');
            return user?.get('twoFactorSecret') || null;
        } catch (error) {
            console.error('Error getting 2FA secret:', error);
            throw new Error('Failed to retrieve 2FA secret');
        }
    }

    async enableTwoFactor(userId: string): Promise<boolean> {
        try {
            const result = await UserModel.findByIdAndUpdate(
                userId,
                { $set: { twoFactorEnabled: true } },
                { new: true }
            );
            return !!result;
        } catch (error) {
            console.error('Error enabling 2FA:', error);
            throw new Error('Failed to enable 2FA');
        }
    }

    async disableTwoFactor(userId: string): Promise<boolean> {
        try {
            const result = await UserModel.findByIdAndUpdate(
                userId,
                { 
                    $set: { twoFactorEnabled: false },
                    $unset: { twoFactorSecret: '' }
                },
                { new: true }
            );
            return !!result;
        } catch (error) {
            console.error('Error disabling 2FA:', error);
            throw new Error('Failed to disable 2FA');
        }
    }
}
