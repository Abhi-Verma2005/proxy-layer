import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { logger } from '../../utils/logger';

const mainDbUrl = process.env.DIRECT_URL;
if (!mainDbUrl) {
  logger.error(`❌ DIRECT_URL environment variable is required for main database`);
  throw new Error('DIRECT_URL environment variable is required');
}

logger.info(`🔍 Main DB connection - URL: ${mainDbUrl!.substring(0, 20)}...`);
logger.debug(`🔍 Main DB connection - Full URL: ${mainDbUrl}`);

// Test the main database connection
async function testMainConnection() {
  try {
    logger.info(`🚀 Testing main database connection...`);
    const testStart = Date.now();
    
    const testSql = postgres(mainDbUrl!, {
      max: 1,
      connect_timeout: 5,
      idle_timeout: 5,
    });
    
    const result = await testSql`SELECT 1 as test`;
    const testTime = Date.now() - testStart;
    
    logger.info(`✅ Main database connection test successful in ${testTime}ms`);
    logger.debug(`🔍 Main DB test result:`, result);
    
    await testSql.end();
  } catch (error) {
    logger.error(`💥 Main database connection test failed:`, error);
    logger.error(`💥 Main DB connection error details:`, {
      message: error instanceof Error ? error.message : String(error),
      code: error instanceof Error && (error as any).code ? (error as any).code : 'unknown',
      errno: error instanceof Error && (error as any).errno ? (error as any).errno : 'unknown',
    });
  }
}

// Run connection test
testMainConnection();

const sql = postgres(mainDbUrl, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});
export const mainDb = drizzle(sql, { schema }); 