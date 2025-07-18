import { BaseAuthStrategy } from '../base/AuthStrategy';
import { AuthContext, AuthResult } from '../../types/auth';
import { User } from '../../types';
import { masterSupabase } from '../../config/supabase';
import { masterPrisma } from '../../config/database';
import { logger } from '../../utils/logger';
import jwt, { SignOptions } from 'jsonwebtoken';    

/**
 * Header-based authentication strategy
 * Injects authentication headers into proxied requests
 * Currently used for Outline integration
 */
export class HeaderAuthStrategy extends BaseAuthStrategy {
  public name = 'header';

  /**
   * Authenticate user using Supabase token from master dashboard
   */
  public async authenticate(context: AuthContext): Promise<AuthResult> {
    try {
      if (!context.token) {
        return { success: false, error: 'No token provided' };
      }
      // Verify token with master Supabase
      const { data, error } = await masterSupabase.auth.getUser(context.token);
      if (error || !data.user) {
        logger.error('Supabase token verification failed:', error);
        return { success: false, error: 'Invalid token' };
      }
      // Get user from master database
      const user = await this.getUserFromMasterDb(data.user.email!);
      if (!user) {
        return { success: false, error: 'User not found' };
      }
      return { success: true, user };
    } catch (error) {
      logger.error('Header auth strategy error:', error);
      return this.handleError(error);
    }
  }

  /**
   * Generate authentication headers for the target service
   */
  public generateHeaders(user: User, service: string): Record<string, string> {
    const baseHeaders = {
      'X-User-Email': user.email,
      'X-User-Name': user.name,
      'X-User-ID': user.id,
      'X-Forwarded-Auth': 'true'
    };
    // Service-specific header generation
    switch (service) {
      case 'outline':
        return this.generateOutlineHeaders(user, baseHeaders);
      default:
        return baseHeaders;
    }
  }

  /**
   * Generate Outline-specific authentication headers
   */
  private generateOutlineHeaders(user: User, baseHeaders: Record<string, string>): Record<string, string> {
    const authPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      timestamp: Date.now()
    };
    let expiresIn: any = '1h';
    if (process.env.JWT_EXPIRES_IN) {
      const val = process.env.JWT_EXPIRES_IN;
      if (!isNaN(Number(val))) {
        expiresIn = Number(val);
      } else {
        expiresIn = val;
      }
    }
    const signOptions = {
      expiresIn
    } as unknown as SignOptions;
    const token = jwt.sign(authPayload, process.env.JWT_SECRET as string, signOptions);
    return {
      ...baseHeaders,
      'X-Auth-Token': token,
      'X-Outline-Auth': 'proxy-injected'
    };
  }

  /**
   * Helper method to get user from master database
   */
  private async getUserFromMasterDb(email: string): Promise<User | null> {
    try {
      const user = await masterPrisma.user.findUnique({
        where: { email }
      });
      return user;
    } catch (error) {
      logger.error('Error fetching user from master DB:', error);
      return null;
    }
  }
} 