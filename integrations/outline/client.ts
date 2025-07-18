import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const sql = postgres(process.env.OUTLINE_DATABASE_URL!);
export const outlineDb = drizzle(sql, { schema }); 