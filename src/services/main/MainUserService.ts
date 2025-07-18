import { mainDb } from '../../../integrations/main/client';
import { user as mainUserTable } from '../../../integrations/main/schema';
import { User } from '../../types';
import { eq } from 'drizzle-orm';

export class MainUserService {
  /**
   * Find a user by email in the main dashboard DB
   */
  public async findByEmail(email: string): Promise<User | null> {
    const result = await mainDb.select().from(mainUserTable).where(eq(mainUserTable.email, email));
    if (!result || result.length === 0) return null;
    const dbUser = result[0];
    return {
      id: dbUser.id,
      email: dbUser.email ?? '',
      name: dbUser.name ?? '',
      avatar: undefined, // main DB does not have avatar
      createdAt: new Date(), // Not available in main DB schema
      updatedAt: new Date(), // Not available in main DB schema
    };
  }
}

export const mainUserService = new MainUserService(); 