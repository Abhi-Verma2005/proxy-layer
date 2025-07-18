import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const sql = postgres(process.env.DIRECT_URL!);
export const mainDb = drizzle(sql, { schema }); 