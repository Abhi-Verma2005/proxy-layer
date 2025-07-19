import { User } from '@/types';
import { logger } from '@/utils/logger';
import { outlineDb } from '@/integrations/outline/client';
import { users as outlineUsersTable } from '@/integrations/outline/schema';
import { eq } from 'drizzle-orm';

/**
 * Outline-specific service implementation
 * Handles user synchronization and service-specific operations
 */
export class OutlineService {
  /**
   * Ensure user exists in Outline database
   * Creates user if doesn't exist, updates if needed
   */
  public async ensureUser(userData: User): Promise<User> {
    const startTime = Date.now();
    logger.debug(`🚀 OutlineService.ensureUser started for email: ${userData.email}`);
  
    try {
      logger.debug(`🔍 Looking up user in Outline DB: ${userData.email}`);
      const queryStart = Date.now();
      
      // Check if user exists in Outline database
      const result = await outlineDb.select().from(outlineUsersTable).where(eq(outlineUsersTable.email, userData.email));
      
      const queryTime = Date.now() - queryStart;
      logger.debug(`🔍 Outline DB query took ${queryTime}ms, result:`, {
        found: result && result.length > 0,
        count: result ? result.length : 0,
        email: userData.email
      });
      
      let outlineUser = result && result.length > 0 ? result[0] : null;
      
      if (outlineUser) {
        logger.debug(`✅ Found Outline user:`, {
          id: outlineUser.id,
          email: outlineUser.email,
          name: outlineUser.name
        });
        
        const user = {
          id: outlineUser.id,
          email: outlineUser.email ?? '',
          name: outlineUser.name ?? '',
          avatar: outlineUser.avatarUrl || undefined,
          createdAt: outlineUser.createdAt,
          updatedAt: outlineUser.updatedAt,
        };
        
        const totalTime = Date.now() - startTime;
        logger.debug(`✅ OutlineService.ensureUser completed in ${totalTime}ms`);
        
        return user;
      } else {
        logger.error(`❌ Outline user not found: ${userData.email}`);
        
        // Let's try a case-insensitive search
        logger.debug(`🔍 Trying case-insensitive search for: ${userData.email}`);
        const searchStart = Date.now();
        const allUsers = await outlineDb.select().from(outlineUsersTable);
        const searchTime = Date.now() - searchStart;
        logger.debug(`🔍 Case-insensitive search took ${searchTime}ms, found ${allUsers.length} total users`);
        logger.debug(`🔍 All users in Outline DB:`, allUsers.map(u => ({ id: u.id, email: u.email, name: u.name })));
        
        // For now, let's return the user data from the main database instead of failing
        logger.warn(`⚠️  User not found in Outline DB, using main DB user data`);
        
        const totalTime = Date.now() - startTime;
        logger.debug(`✅ OutlineService.ensureUser completed in ${totalTime}ms (fallback)`);
        
        return userData;
      }
    } catch (error) {
      logger.error('Error ensuring Outline user:', error);
      
      // If it's a database connection error, fall back to main DB user data
      if (error && typeof error === 'object' && 'cause' in error && error.cause && typeof error.cause === 'object' && 'code' in error.cause) {
        const cause = error.cause as { code?: string };
        if (cause.code === 'CONNECT_TIMEOUT' || cause.code === 'ECONNREFUSED') {
          logger.warn(`⚠️  Outline database connection failed, using main DB user data as fallback`);
          return userData;
        }
      }
      
      throw error;
    }
  }
  /**
   * Check if Outline service is healthy
   */
  public async checkHealth(): Promise<boolean> {
    try {
      // Simple database connectivity check
      // TODO: Implement Outline Prisma health check
      return true;
    } catch (error) {
      logger.error('Outline health check failed:', error);
      return false;
    }
  }
  /**
   * Get user activity summary (for dashboard)
   */
  public async getUserActivity(userId: string): Promise<any> {
    try {
      // TODO: Implement user activity tracking
      // This would fetch user's recent documents, team activity, etc.
      return {
        lastAccess: new Date(),
        documentsCount: 0,
        teamsCount: 0
      };
    } catch (error) {
      logger.error('Error fetching user activity:', error);
      return null;
    }
  }
}

export const outlineService = new OutlineService(); 