import express from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';
import { env } from './config/env';
import { connectDB } from './config/db';
import { connectRedis } from './config/redis';
import { setupSocketIO } from './socket/socketManager';
import { startWorker } from './queues/generationWorker';
import assignmentRoutes from './routes/assignments';
import generationRoutes from './routes/generation';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const server = http.createServer(app);

// ─── Middleware ───
app.use(cors({
  origin: env.CLIENT_URL,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ─── Health Check ───
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Routes ───
app.use('/api/assignments', assignmentRoutes);
app.use('/api', generationRoutes);

// ─── Error Handler ───
app.use(errorHandler);

// ─── Start Server ───
async function start() {
  // Connect to MongoDB
  await connectDB();

  // Try to connect to Redis (optional — server works without it)
  await connectRedis();

  // Setup Socket.io
  const io = setupSocketIO(server);

  // Start BullMQ worker (only if Redis is available)
  try {
    startWorker(io);
  } catch (err) {
    console.warn('⚠️ BullMQ worker could not start:', (err as Error).message);
  }

  // Listen
  server.listen(env.PORT, () => {
    console.log(`
╔══════════════════════════════════════════╗
║  🚀 VedaAI Server running on port ${env.PORT}  ║
║  📡 Socket.io ready                     ║
║  🔗 ${env.CLIENT_URL}                   ║
╚══════════════════════════════════════════╝
    `);
  });
}

start().catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM. Shutting down gracefully...');
  server.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT. Shutting down gracefully...');
  server.close();
  process.exit(0);
});
