import dotenv from 'dotenv';

dotenv.config();

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  PORT: parseInt(process.env.PORT || '4000', 10),
  MONGO_URI: requireEnv('MONGO_URI'),
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  GEMINI_API_KEY: requireEnv('GEMINI_API_KEY'),
  CLERK_SECRET_KEY: requireEnv('CLERK_SECRET_KEY'),
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',

  // Cloudflare R2
  R2_ACCOUNT_ID: requireEnv('R2_ACCOUNT_ID'),
  R2_ACCESS_KEY_ID: requireEnv('R2_ACCESS_KEY_ID'),
  R2_SECRET_ACCESS_KEY: requireEnv('R2_SECRET_ACCESS_KEY'),
  R2_BUCKET_NAME: requireEnv('R2_BUCKET_NAME'),
  R2_PUBLIC_URL: process.env.R2_PUBLIC_URL || '',
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',
} as const;
