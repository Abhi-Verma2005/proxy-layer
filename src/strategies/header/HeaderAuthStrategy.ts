import { BaseAuthStrategy } from '../base/AuthStrategy';
import { AuthContext, AuthResult } from '../../types/auth';
import { User } from '../../types';
import { getSupabaseClient } from '@/config/supabase';
import { logger } from '../../utils/logger';
import jwt, { SignOptions } from 'jsonwebtoken';    
import { mainDb } from '../../integrations/main/client';
import { user as mainUserTable } from '../../integrations/main/schema';
import { outlineService } from '../../services/outline/OutlineService';
import { mainUserService } from '../../services/main/MainUserService';

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
    const startTime = Date.now();
    logger.debug(`🚀 HeaderAuthStrategy.authenticate started at ${new Date().toISOString()}`);
    
    try {
      logger.debug(`🔍 HeaderAuthStrategy - checking token presence`);
      if (!context.token) {
        logger.debug(`❌ HeaderAuthStrategy - no token provided`);
        return { success: false, error: 'No token provided' };
      }
      
      logger.debug(`🔍 HeaderAuthStrategy - token length: ${context.token.length}`);
      logger.debug(`🔍 HeaderAuthStrategy - verifying token with Supabase...`);
      const supabaseStart = Date.now();
      
      // Verify token with master Supabase
      const { data, error } = await getSupabaseClient().auth.getUser(context.token);
      const supabaseTime = Date.now() - supabaseStart;
      logger.debug(`🔍 HeaderAuthStrategy - Supabase verification took ${supabaseTime}ms`);
      
      if (error || !data.user) {
        logger.error('Supabase token verification failed:', error);
        return { success: false, error: 'Invalid token' };
      }
      
      logger.debug(`🔍 HeaderAuthStrategy - Supabase user verified:`, {
        id: data.user.id,
        email: data.user.email,
        emailVerified: data.user.email_confirmed_at
      });
      
      logger.debug(`🔍 HeaderAuthStrategy - getting user from master DB...`);
      const masterDbStart = Date.now();
      
      // Get user from master database using Drizzle ORM
      const user = await this.getUserFromMasterDb(data.user.email!);
      const masterDbTime = Date.now() - masterDbStart;
      logger.debug(`🔍 HeaderAuthStrategy - master DB lookup took ${masterDbTime}ms`);
      
      if (!user) {
        logger.debug(`❌ HeaderAuthStrategy - user not found in master DB`);
        return { success: false, error: 'User not found' };
      }
      
      logger.debug(`🔍 HeaderAuthStrategy - master DB user found:`, {
        id: user.id,
        email: user.email,
        name: user.name
      });
      
      logger.debug(`🔍 HeaderAuthStrategy - calling outlineService.ensureUser for user: ${user.email}`);
      const outlineStart = Date.now();
      
      // Ensure user exists in Outline DB (create if not)
      const outlineUser = await outlineService.ensureUser(user);
      const outlineTime = Date.now() - outlineStart;
      logger.debug(`🔍 HeaderAuthStrategy - outlineService.ensureUser took ${outlineTime}ms`);
      
      logger.debug(`🔍 HeaderAuthStrategy - outlineService.ensureUser returned:`, {
        id: outlineUser.id,
        email: outlineUser.email,
        name: outlineUser.name
      });
      
      const totalTime = Date.now() - startTime;
      logger.debug(`✅ HeaderAuthStrategy.authenticate completed in ${totalTime}ms`);
      
      return { success: true, user: outlineUser };
    } catch (error) {
      logger.error('Header auth strategy error:', error);
      logger.error('Header auth strategy error details:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        cause: error instanceof Error && (error as any).cause ? (error as any).cause : undefined
      });
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
      return await mainUserService.findByEmail(email);
    } catch (error) {
      logger.error('Error fetching user from master DB:', error);
      return null;
    }
  }
} 