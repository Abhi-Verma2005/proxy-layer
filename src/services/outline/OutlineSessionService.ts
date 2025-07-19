import { SupabaseClient } from '@supabase/supabase-js';
import { getOutlineSupabaseAdminClient } from '@/config/supabase';
import { User } from '@/types';
import { logger } from '@/utils/logger';

export interface SessionStatus {
  hasActiveSession: boolean;
  sessionData?: {
    userId: string;
    hasUserAuth: boolean;
    hasOAuthAuth: boolean;
    hasApiKey: boolean;
    userAuths: any[];
    oauthAuths: any[];
    apiKeys: any[];
  };
  error?: string;
}

export interface CrossDatabaseSessionResult {
  userExists: boolean;
  hasActiveSession: boolean;
  outlineUserId?: string;
  sessionData?: any;
  error?: string;
}

/**
 * Service to handle cross-database session validation
 * Checks if user has active sessions in Outline's Supabase database
 */
export class OutlineSessionService {
  private outlineAdminClient: SupabaseClient;

  constructor() {
    try {
      this.outlineAdminClient = getOutlineSupabaseAdminClient();
      logger.info('✅ OutlineSessionService initialized successfully');
    } catch (error) {
      logger.error('❌ Failed to initialize Outline session service:', error);
      throw error;
    }
  }

  /**
   * Check if user has active session in Outline database
   * Maps user from main app to Outline via email
   */
  async checkUserOutlineSession(mainAppUser: User): Promise<CrossDatabaseSessionResult> {
    logger.info(`🔍 Checking session for user: ${mainAppUser.email}`);

    try {
      // Find user in Outline database by email
      const outlineUser = await this.findOutlineUserByEmail(mainAppUser.email);
      
      if (!outlineUser) {
        return {
          userExists: false,
          hasActiveSession: false,
          error: 'User not found in Outline database'
        };
      }

      // Check for active session - simplified logic
      const sessionStatus = await this.checkActiveSessions(outlineUser.id);

      return {
        userExists: true,
        hasActiveSession: sessionStatus.hasActiveSession,
        outlineUserId: outlineUser.id,
        sessionData: sessionStatus.sessionData,
        error: sessionStatus.error
      };

    } catch (error) {
      logger.error(`❌ Error checking Outline session:`, error);
      
      return {
        userExists: false,
        hasActiveSession: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Find user in Outline database by email
   */
  private async findOutlineUserByEmail(email: string): Promise<any | null> {
    try {
      const { data, error } = await this.outlineAdminClient
        .from('users')
        .select('id, email, createdAt, updatedAt, lastActiveAt, lastSignedInAt, jwtSecret, deletedAt, suspendedAt, teamId')
        .eq('email', email)
        .is('deletedAt', null)
        .is('suspendedAt', null)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return data;
      
    } catch (error) {
      logger.error(`❌ Error finding Outline user by email:`, error);
      throw error;
    }
  }

  /**
   * Check for active sessions - comprehensive check including actual session state
   */
  private async checkActiveSessions(outlineUserId: string): Promise<SessionStatus> {
    logger.debug(`🔍 Checking active sessions for user: ${outlineUserId}`);
    
    try {
      const now = new Date();
      logger.info(`⏰ Current time: ${now.toISOString()}`);
      
      // Strategy 1: Check user_authentications with expiration filter
      const { data: userAuths, error: userAuthError } = await this.outlineAdminClient
        .from('user_authentications')
        .select('id, userId, accessToken, refreshToken, expiresAt, lastValidatedAt')
        .eq('userId', outlineUserId);

      if (userAuthError) {
        logger.error(`❌ Error checking user_authentications:`, userAuthError);
      }

      // Log all authentication records found
      logger.info(`📊 User authentication records found: ${userAuths?.length || 0}`);
      if (userAuths && userAuths.length > 0) {
        userAuths.forEach((auth, index) => {
          logger.info(`📊 Auth ${index + 1}:`, {
            id: auth.id,
            expiresAt: auth.expiresAt,
            lastValidatedAt: auth.lastValidatedAt,
            hasAccessToken: !!auth.accessToken,
            hasRefreshToken: !!auth.refreshToken
          });
        });
      }

      // Filter valid sessions in application code for better control
      let validUserAuths: any[] = [];
      if (userAuths && userAuths.length > 0) {
        validUserAuths = userAuths.filter(auth => {
          // Handle null/undefined expiresAt
          if (!auth.expiresAt) {
            logger.info(`❌ Auth ${auth.id} has no expiration - INVALID`);
            return false;
          }

          try {
            const expiresAt = new Date(auth.expiresAt);
            const isValid = expiresAt > now;
            
            logger.info(`🔍 Auth ${auth.id} validation:`, {
              expiresAt: auth.expiresAt,
              expirationTime: expiresAt.toISOString(),
              currentTime: now.toISOString(),
              isValid,
              timeDifference: expiresAt.getTime() - now.getTime()
            });
            return isValid;
          } catch (dateError) {
            logger.warn(`❌ Invalid date format for auth ${auth.id}: ${auth.expiresAt}`);
            return false;
          }
        });
      }

      // Strategy 2: Check if user has actual session tokens/cookies
      let hasActiveSessionToken = false;
      try {
        // Check for active session tokens in oauth_authentications
        const { data: oauthAuths, error: oauthError } = await this.outlineAdminClient
          .from('oauth_authentications')
          .select('id, userId, accessTokenExpiresAt, lastActiveAt')
          .eq('userId', outlineUserId);

        logger.info(`📊 OAuth authentication records found: ${oauthAuths?.length || 0}`);
        if (oauthAuths && oauthAuths.length > 0) {
          oauthAuths.forEach((auth, index) => {
            logger.info(`📊 OAuth Auth ${index + 1}:`, {
              id: auth.id,
              accessTokenExpiresAt: auth.accessTokenExpiresAt,
              lastActiveAt: auth.lastActiveAt
            });
          });
        }

        if (!oauthError && oauthAuths && oauthAuths.length > 0) {
          const validOAuthAuths = oauthAuths.filter(auth => {
            if (!auth.accessTokenExpiresAt) {
              logger.info(`❌ OAuth auth ${auth.id} has no expiration - INVALID`);
              return false;
            }
            const expiresAt = new Date(auth.accessTokenExpiresAt);
            const isValid = expiresAt > now;
            logger.info(`🔍 OAuth auth ${auth.id} validation:`, {
              accessTokenExpiresAt: auth.accessTokenExpiresAt,
              expirationTime: expiresAt.toISOString(),
              currentTime: now.toISOString(),
              isValid,
              timeDifference: expiresAt.getTime() - now.getTime()
            });
            return isValid;
          });
          
          hasActiveSessionToken = validOAuthAuths.length > 0;
          logger.info(`📊 Valid OAuth session tokens: ${validOAuthAuths.length}`);
        }
      } catch (oauthCheckError) {
        logger.warn(`❌ Could not check OAuth sessions:`, oauthCheckError);
      }

      // Strategy 3: Check user's last activity as additional validation
      let hasRecentActivity = false;
      try {
        const { data: userData, error: userError } = await this.outlineAdminClient
          .from('users')
          .select('lastActiveAt, lastSignedInAt, jwtSecret')
          .eq('id', outlineUserId)
          .single();

        if (!userError && userData) {
          const lastActive = userData.lastActiveAt ? new Date(userData.lastActiveAt) : null;
          const lastSignedIn = userData.lastSignedInAt ? new Date(userData.lastSignedInAt) : null;
          
          // Consider active if user was active within last 1 hour (more strict)
          const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
          
          logger.info(`📊 User activity data:`, {
            lastActiveAt: userData.lastActiveAt,
            lastSignedInAt: userData.lastSignedInAt,
            lastActiveTime: lastActive?.toISOString(),
            lastSignedInTime: lastSignedIn?.toISOString(),
            oneHourAgo: oneHourAgo.toISOString(),
            hasJwtSecret: !!userData.jwtSecret
          });
          
          hasRecentActivity = !!(
            (lastActive && lastActive > oneHourAgo) ||
            (lastSignedIn && lastSignedIn > oneHourAgo)
          );

          logger.info(`📊 Activity validation:`, {
            lastActiveValid: lastActive ? lastActive > oneHourAgo : false,
            lastSignedInValid: lastSignedIn ? lastSignedIn > oneHourAgo : false,
            hasRecentActivity
          });
        }
      } catch (userCheckError) {
        logger.warn(`❌ Could not check user activity:`, userCheckError);
      }

      // Strategy 4: More strict session validation
      // Only consider session active if we have BOTH valid auth records AND recent activity
      const hasValidAuthRecords = validUserAuths.length > 0 || hasActiveSessionToken;
      const hasActiveSession = hasValidAuthRecords && hasRecentActivity;

      logger.info(`📊 FINAL SESSION CHECK RESULTS:`, {
        userId: outlineUserId,
        currentTime: now.toISOString(),
        totalUserAuths: userAuths?.length || 0,
        validUserAuths: validUserAuths.length,
        hasActiveSessionToken,
        hasRecentActivity,
        hasValidAuthRecords,
        hasActiveSession,
        decision: hasActiveSession ? 'ACTIVE SESSION' : 'NO ACTIVE SESSION'
      });

      if (hasActiveSession) {
        logger.info(`✅ User has active session (comprehensive check): ${outlineUserId}`);
        return {
          hasActiveSession: true,
          sessionData: {
            userId: outlineUserId,
            hasUserAuth: validUserAuths.length > 0,
            hasOAuthAuth: hasActiveSessionToken,
            hasApiKey: false,
            userAuths: validUserAuths,
            oauthAuths: [],
            apiKeys: []
          }
        };
      } else {
        logger.warn(`❌ User has no active session (comprehensive check): ${outlineUserId}`);
        logger.info(`📊 Session validation failed - redirecting to OAuth`);
        return { hasActiveSession: false };
      }

    } catch (error) {
      logger.error(`❌ Error checking active sessions:`, error);
      return {
        hasActiveSession: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get Outline OAuth URL for user
   */
  generateOAuthUrl(user: User): string {
    const baseUrl = process.env.OUTLINE_BASE_URL || 'http://localhost:3000';
    
    const stateData = {
      userId: user.id,
      email: user.email,
      returnUrl: 'http://localhost:8000/outline',
      timestamp: Date.now()
    };
    
    const state = this.encryptState(stateData);
    const oauthUrl = `${baseUrl}/auth/google?client=web&host=localhost&state=${encodeURIComponent(state)}`;
    
    logger.info(`🔄 Generated OAuth URL:`, { oauthUrl, baseUrl });
    
    return oauthUrl;
  }

  /**
   * Encrypt state data for OAuth security
   */
  private encryptState(data: any): string {
    try {
      return Buffer.from(JSON.stringify(data)).toString('base64');
    } catch (error) {
      logger.error('❌ Error encrypting state data:', error);
      throw error;
    }
  }

  /**
   * Decrypt state data from OAuth callback
   */
  decryptState(encryptedState: string): any {
    try {
      const decoded = Buffer.from(encryptedState, 'base64').toString();
      return JSON.parse(decoded);
    } catch (error) {
      logger.error('❌ Error decrypting state data:', error);
      throw error;
    }
  }

  /**
   * Check if Outline session checking is available
   */
  isAvailable(): boolean {
    try {
      this.outlineAdminClient;
      return true;
    } catch {
      return false;
    }
  }
}

export const outlineSessionService = new OutlineSessionService();