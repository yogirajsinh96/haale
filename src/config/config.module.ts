import { Module } from '@nestjs/common';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load .env before anything else
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

@Module({})
export class ConfigModule {}
