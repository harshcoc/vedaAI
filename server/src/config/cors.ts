import { env } from './env';

const allowedOrigins = [
  env.CLIENT_URL,
  'http://localhost:3000',
  'https://veda-ai-five-alpha.vercel.app'
];

/**
 * Dynamic CORS origin handler to support localhost, primary production domains,
 * and Vercel preview/branch deployments.
 */
export const corsOrigin = (
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void
): void => {
  // Allow requests with no origin (like server-to-server or curl)
  if (!origin) {
    callback(null, true);
    return;
  }

  const isAllowed =
    allowedOrigins.includes(origin) ||
    origin.endsWith('.vercel.app') ||
    origin.startsWith('http://localhost:');

  if (isAllowed) {
    callback(null, true);
  } else {
    console.warn(`⚠️ Blocked by CORS: Origin ${origin}`);
    callback(new Error(`Origin ${origin} not allowed by CORS`));
  }
};
