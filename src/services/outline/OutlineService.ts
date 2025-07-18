import { User } from '../../types';
import { outlinePrisma } from '../../config/database';
import { logger } from '../../utils/logger';

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
    try {
      // Check if user exists in Outline database
      let outlineUser = await outlinePrisma.outlineUser.findUnique({
        where: { email: userData.email }
      });
      if (outlineUser) {
        // Update existing user if data has changed
        outlineUser = await outlinePrisma.outlineUser.update({
          where: { email: userData.email },
          data: {
            name: userData.name,
            avatarUrl: userData.avatar || null,
            updatedAt: new Date()
          }
        });
      } else {
        // Create new user in Outline database
        outlineUser = await outlinePrisma.outlineUser.create({
          data: {
            email: userData.email,
            name: userData.name,
            avatarUrl: userData.avatar || null
          }
        });
        logger.info(`Created new Outline user: ${userData.email}`);
      }
      return outlineUser as User;
    } catch (error) {
      logger.error('Error ensuring Outline user:', error);
      throw error;
    }
  }
  /**
   * Check if Outline service is healthy
   */
  public async checkHealth(): Promise<boolean> {
    try {
      // Simple database connectivity check
      await outlinePrisma.$queryRaw`SELECT 1`;
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