import { randomInt } from 'node:crypto';
import { TokenModel, IToken } from '../models/Token';
import { TokenType } from '../types/customRequest';
import { inject, injectable } from 'inversify';
import { Types } from 'mongoose';
import { TYPES } from '../config/types';
import { MailService } from './MailService';
import { ApiError } from '../utils/ApiError';
import { TOKEN_EXPIRY_MINUTES } from '../secrets';


@injectable()
export default class TokenService {

  constructor(
    @inject(TYPES.MailService) private mailService: MailService
  ) { }

  async generateToken(): Promise<number> {
    // Generate a secure random number between 100000 and 999999 (inclusive)
    const token = randomInt(100000, 1000000);
    return token;
  }


  async sendVerificationToken(userId: string, email: string) {
    const token = await this.createVerificationToken(TokenType.EMAIL, userId, email);
    await this.mailService.sendVerification(email, token);
  }


  async createVerificationToken(
    type: TokenType,
    userId?: string,
    email?: string
  ): Promise<number> {
    const query: any = {};
    if (userId) query.user = new Types.ObjectId(userId);
    if (email) query.email = email;
    query.type = type;
    query.used = false;
  
    // Check if there's an unused + unexpired token
    const existingToken = await TokenModel.findOne(query).sort({ createdAt: -1 });
  
    if (existingToken) {
      // Token still valid → just return the same one
      return existingToken.token;
    } 
    // Otherwise, generate a new one
    const token = await this.generateToken();
  
    const created = await new TokenModel({
      user: userId ? new Types.ObjectId(userId) : undefined,
      email: email || undefined,
      token,
      type,
    }).save();
  
    if (!created) {
      throw ApiError.internal("Token saving failed");
    }
  
    return token;
  }
  

  async validateToken(
    token: string,
    identifier: string,
    type?: TokenType
  ): Promise<IToken | null> {
    const conditions: any = { token };

    // Build OR conditions safely
    const orConditions: any[] = [];

    if (Types.ObjectId.isValid(identifier)) {
      orConditions.push({ user: new Types.ObjectId(identifier) });
    } else {
      orConditions.push({ email: identifier });
    }

    conditions.$or = orConditions;

    if (type) {
      conditions.type = type;
    }

    return await TokenModel.findOne(conditions);
  }



  async deleteToken(identifier: string) {

    const conditions: any = {};

    // Build OR conditions safely
    const orConditions: any[] = [];

    if (Types.ObjectId.isValid(identifier)) {
      orConditions.push({ user: new Types.ObjectId(identifier) });
    } else {
      orConditions.push({ email: identifier });
    }
    conditions.$or = orConditions;
    return TokenModel.deleteMany({
      ...conditions
    });
  }

  async updateTokenUsablility(id: string) {
    await TokenModel.findByIdAndUpdate(
      id,
      { usedAt: new Date(), used: true }, 
      {new: true}
    );
  }
  async invalidateExistingTokens(identifier: string, type?: TokenType) {
    const filter: any = {
      usedAt: { $exists: false },
    };

    // Build OR conditions safely
    const orConditions: any[] = [];
    if (Types.ObjectId.isValid(identifier)) {
      orConditions.push({ user: new Types.ObjectId(identifier) });
    } else {
      orConditions.push({ email: identifier });
    }
    filter.$or = orConditions;
    if (type) filter.type = type;

    await TokenModel.updateMany(
      filter,
      { $set: { usedAt: new Date(), used: true } }
    );
  }
  async getUsedTokenForUser(identifier: string, lastUsed: boolean = true) {
    const conditions: any = { used: true };
  
    // Build OR conditions safely
    const orConditions: any[] = [];
  
    if (Types.ObjectId.isValid(identifier)) {
      orConditions.push({ user: new Types.ObjectId(identifier) });
    } else {
      orConditions.push({ email: identifier });
    }
    conditions.$or = orConditions;
  
    // Apply usedAt condition only if lastUsed flag is true
    if (lastUsed) {
      conditions.usedAt = { $lt: new Date() };
    }
    return await TokenModel.findOne(conditions)
      .sort({ usedAt: -1, updatedAt: -1 })
      .lean(); 
  }
  async getUnusedTokenForResend(identifier: string, allowExpired: boolean = false) {
    const conditions: any = { used: false };
    
    // Build OR conditions for user/email
    conditions.$or = [];
    
    if (Types.ObjectId.isValid(identifier)) {
      conditions.$or.push({ user: new Types.ObjectId(identifier) });
    } else {
      conditions.$or.push({ email: identifier });
    }
    
    // If we don't allow expired tokens, add createdAt condition
    if (!allowExpired) {
      const expiryCutoff = new Date(Date.now() - Number(TOKEN_EXPIRY_MINUTES) * 60 * 1000);
      conditions.createdAt = { $gte: expiryCutoff };
    }
    
    // Get the most recent unused token
    return await TokenModel.findOne(conditions)
      .sort({ createdAt: -1 }) // Most recent first
      .lean();
  }
  
}
