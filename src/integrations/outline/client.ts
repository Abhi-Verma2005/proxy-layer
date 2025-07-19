import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { logger } from '../../utils/logger';

const databaseUrl = process.env.OUTLINE_DATABASE_URL || process.env.DATABASE_URL;
if (!databaseUrl) {
  logger.error(`❌ OUTLINE_DATABASE_URL or DATABASE_URL environment variable is required`);
  throw new Error('OUTLINE_DATABASE_URL or DATABASE_URL environment variable is required');
}

logger.info(`🔍 Outline DB connection - URL: ${databaseUrl!.substring(0, 20)}...`);
logger.debug(`🔍 Outline DB connection - Full URL: ${databaseUrl}`);

// Test the connection immediately
async function testOutlineConnection() {
  try {
    logger.info(`🚀 Testing Outline database connection...`);
    const testStart = Date.now();
    
    const testSql = postgres(databaseUrl!, {
      max: 1,
      connect_timeout: 5, // Shorter timeout for testing
      idle_timeout: 5,
    });
    
    // Test a simple query
    const result = await testSql`SELECT 1 as test`;
    const testTime = Date.now() - testStart;
    
    logger.info(`✅ Outline database connection test successful in ${testTime}ms`);
    logger.debug(`🔍 Outline DB test result:`, result);
    
    await testSql.end();
  } catch (error) {
    logger.error(`💥 Outline database connection test failed:`, error);
    logger.error(`💥 Outline DB connection error details:`, {
      message: error instanceof Error ? error.message : String(error),
      code: error instanceof Error && (error as any).code ? (error as any).code : 'unknown',
      errno: error instanceof Error && (error as any).errno ? (error as any).errno : 'unknown',
      address: error instanceof Error && (error as any).address ? (error as any).address : 'unknown',
      port: error instanceof Error && (error as any).port ? (error as any).port : 'unknown',
    });
    
    // Don't throw here, let the main connection attempt proceed
  }
}

// Run connection test
testOutlineConnection();

const sql = postgres(databaseUrl, {
  max: 10, // Maximum number of connections
  idle_timeout: 20, // Close connections after 20 seconds of inactivity
  connect_timeout: 10, // Connection timeout of 10 seconds
  onnotice: (notice) => logger.debug(`🔍 Outline DB notice: ${notice.message}`),
});

export const outlineDb = drizzle(sql, { schema });
export { schema }; 