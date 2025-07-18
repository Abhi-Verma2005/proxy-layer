import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const sql = postgres(process.env.APP_DB_URL!);
export const appDb = drizzle(sql, { schema }); 