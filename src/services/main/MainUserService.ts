import { mainDb } from '../../integrations/main/client';
import { user as mainUserTable } from '../../integrations/main/schema';
import { User } from '../../types';
import { eq } from 'drizzle-orm';
import { logger } from '../../utils/logger';

export class MainUserService {
  /**
   * Find a user by email in the main dashboard DB
   */
  public async findByEmail(email: string): Promise<User | null> {
    const startTime = Date.now();
    logger.debug(`🚀 MainUserService.findByEmail started for email: ${email}`);
    
    try {
      logger.debug(`🔍 MainUserService - executing query on main DB...`);
      const queryStart = Date.now();
      
      const result = await mainDb.select().from(mainUserTable).where(eq(mainUserTable.email, email));
      
      const queryTime = Date.now() - queryStart;
      logger.debug(`🔍 MainUserService - query took ${queryTime}ms, found ${result ? result.length : 0} results`);
      
      if (!result || result.length === 0) {
        logger.debug(`❌ MainUserService - no user found for email: ${email}`);
        return null;
      }
      
      const dbUser = result[0];
      logger.debug(`✅ MainUserService - user found:`, {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name
      });
      
      const user = {
        id: dbUser.id,
        email: dbUser.email ?? '',
        name: dbUser.name ?? '',
        avatar: undefined, // main DB does not have avatar
        createdAt: new Date(), // Not available in main DB schema
        updatedAt: new Date(), // Not available in main DB schema
      };
      
      const totalTime = Date.now() - startTime;
      logger.debug(`✅ MainUserService.findByEmail completed in ${totalTime}ms`);
      
      return user;
    } catch (error) {
      const totalTime = Date.now() - startTime;
      logger.error(`💥 MainUserService.findByEmail failed after ${totalTime}ms:`, error);
      throw error;
    }
  }
}

export const mainUserService = new MainUserService(); 