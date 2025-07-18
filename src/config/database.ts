import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

// Master dashboard database client
export const masterPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.MASTER_DATABASE_URL
    }
  },
  log: ['query', 'info', 'warn', 'error']
});

// Outline database client
export const outlinePrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.OUTLINE_DATABASE_URL
    }
  },
  log: ['query', 'info', 'warn', 'error']
});

// Database connection health check
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    await masterPrisma.$queryRaw`SELECT 1`;
    await outlinePrisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error('Database health check failed:', error);
    return false;
  }
};

// Graceful shutdown
export const closeDatabaseConnections = async (): Promise<void> => {
  await masterPrisma.$disconnect();
  await outlinePrisma.$disconnect();
  logger.info('Database connections closed');
}; 