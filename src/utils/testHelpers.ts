import { User } from '../types';

/**
 * Test helper functions
 * Used for integration and unit testing
 */
export const createTestUser = async (userData: Partial<User>): Promise<User> => {
  // TODO: Re-implement test helpers using Drizzle ORM clients from integrations/.
  return masterPrisma.user.create({
    data: {
      email: userData.email || 'test@example.com',
      name: userData.name || 'Test User',
      avatar: userData.avatar || null
    }
  });
};

export const deleteTestUser = async (email: string): Promise<void> => {
  // TODO: Re-implement test helpers using Drizzle ORM clients from integrations/.
  await masterPrisma.user.deleteMany({ where: { email } });
};

export const createOutlineTestUser = async (userData: Partial<User>): Promise<User> => {
  // TODO: Re-implement test helpers using Drizzle ORM clients from integrations/.
  return masterPrisma.outlineUser.create({
    data: {
      email: userData.email || 'test@example.com',
      name: userData.name || 'Test User',
      avatarUrl: userData.avatar || null
    }
  });
};

export const deleteOutlineTestUser = async (email: string): Promise<void> => {
  // TODO: Re-implement test helpers using Drizzle ORM clients from integrations/.
  await masterPrisma.outlineUser.deleteMany({ where: { email } });
}; 