import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter.js';
import { ExpressAdapter } from '@bull-board/express';
import env from './config/env.js';
import logger from './config/logger.js';
import routes from './routes/index.js';
import { allQueues } from './queues/index.js';

import compression from 'compression';

const app = express();

// Enable Gzip/Brotli compression
app.use(compression());

// Slow request logger middleware (> 1000ms)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    if (ms > 1000) {
      logger.warn({ method: req.method, url: req.originalUrl, ms, status: res.statusCode }, '⚠️ SLOW REQUEST (>1000ms)');
    }
  });
  next();
});

// Security Middleware (Configure CSP to allow Bull Board styles/scripts)
app.use(
  helmet({
    contentSecurityPolicy: false
  })
);

// CORS Configuration
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true
  })
);

// Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Bull Board Admin UI
try {
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues-dashboard');

  createBullBoard({
    queues: allQueues.map((q) => new BullMQAdapter(q)),
    serverAdapter
  });

  app.use('/admin/queues-dashboard', serverAdapter.getRouter());
  logger.info('Bull Board dashboard mounted at /admin/queues-dashboard');
} catch (err) {
  logger.warn({ err: err.message }, 'Could not mount Bull Board dashboard UI');
}

import errorHandler from './middlewares/error.middleware.js';

// API Routes
app.use('/api/v1', routes);

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    status: 'error',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Global Error Handler
app.use(errorHandler);

export default app;
