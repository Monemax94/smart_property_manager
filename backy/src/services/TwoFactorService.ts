import 'reflect-metadata';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { inject, injectable } from 'inversify';;
import { TYPES } from '../config/types';
import { 
    ITwoFactorService,
    ITwoFactorRepository,
    ITwoFactorSecret,
    IVerifyTokenResult } from "../interfaces/ITwoFactor";


@injectable()
export class TwoFactorService implements ITwoFactorService {
    private appName = 'YourAppName'; 

    constructor(
        @inject(TYPES.TwoFactorRepository) private repository: ITwoFactorRepository
    ) {}

    /**
     * Generate a new 2FA secret and QR code for user
     */
    async generateSecret(userId: string, email: string): Promise<ITwoFactorSecret> {
        try {
            // Check if user exists
            const user = await this.repository.findUserById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Generate secret
            const secret = speakeasy.generateSecret({
                name: `${this.appName} (${email})`,
                issuer: this.appName,
                length: 32,
            });

            if (!secret.base32) {
                throw new Error('Failed to generate secret');
            }

            // Save secret to database (temporarily until verified)
            await this.repository.saveTwoFactorSecret(userId, secret.base32);

            // Generate QR code
            const otpauthUrl = secret.otpauth_url || '';
            const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);

            return {
                secret: secret.base32,
                qrCodeUrl,
                manualEntryKey: secret.base32,
            };
        } catch (error) {
            console.error('Error generating 2FA secret:', error);
            throw new Error('Failed to generate 2FA secret');
        }
    }

    /**
     * Verify a token from authenticator app
     */
    async verifyToken(userId: string, token: string): Promise<IVerifyTokenResult> {
        try {
            // Get user's secret
            const secret = await this.repository.getTwoFactorSecret(userId);
            
            if (!secret) {
                return {
                    verified: false,
                    message: '2FA is not set up for this user',
                };
            }

            // Verify token with speakeasy
            const verified = speakeasy.totp.verify({
                secret,
                encoding: 'base32',
                token,
                window: 2, // Allow 2 time steps before/after for clock drift
            });

            return {
                verified,
                message: verified ? 'Token verified successfully' : 'Invalid token',
            };
        } catch (error) {
            console.error('Error verifying token:', error);
            return {
                verified: false,
                message: 'Error verifying token',
            };
        }
    }

    /**
     * Enable 2FA after verifying initial token
     */
    async enableTwoFactor(userId: string, token: string): Promise<IVerifyTokenResult> {
        try {
            // First verify the token
            const verification = await this.verifyToken(userId, token);
            
            if (!verification.verified) {
                return {
                    verified: false,
                    message: 'Invalid token. Please try again.',
                };
            }

            // Enable 2FA in database
            await this.repository.enableTwoFactor(userId);

            return {
                verified: true,
                message: '2FA enabled successfully',
            };
        } catch (error) {
            console.error('Error enabling 2FA:', error);
            return {
                verified: false,
                message: 'Failed to enable 2FA',
            };
        }
    }

    /**
     * Disable 2FA after verifying token
     */
    async disableTwoFactor(userId: string, token: string): Promise<IVerifyTokenResult> {
        try {
            // Verify token before disabling
            const verification = await this.verifyToken(userId, token);
            
            if (!verification.verified) {
                return {
                    verified: false,
                    message: 'Invalid token. Cannot disable 2FA.',
                };
            }

            // Disable 2FA and remove secret
            await this.repository.disableTwoFactor(userId);

            return {
                verified: true,
                message: '2FA disabled successfully',
            };
        } catch (error) {
            console.error('Error disabling 2FA:', error);
            return {
                verified: false,
                message: 'Failed to disable 2FA',
            };
        }
    }

    /**
     * Check if 2FA is enabled for user
     */
    async checkTwoFactorStatus(userId: string): Promise<boolean> {
        try {
            const user = await this.repository.findUserById(userId);
            return user?.twoFactorEnabled || false;
        } catch (error) {
            console.error('Error checking 2FA status:', error);
            return false;
        }
    }
}