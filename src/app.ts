import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { authMiddleware } from './middleware/auth';
import { createServiceProxy } from './middleware/proxy';
import { serviceRegistry } from './services/registry/ServiceRegistry';
import { logger } from './utils/logger';

const app: express.Express = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});
app.use(limiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add request timing
app.use((req, res, next) => {
  (req as any).startTime = Date.now();
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  const services = serviceRegistry.getAllStatuses();
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services
  });
});

// Service status endpoint
app.get('/services', (req, res) => {
  const services = serviceRegistry.getEnabledServices().map(service => ({
    name: service.name,
    displayName: service.displayName,
    status: serviceRegistry.getServiceStatus(service.name)
  }));
  res.json(services);
});

// Authentication middleware for all service routes
app.use('/:service', authMiddleware);

// Setup proxy routes for all enabled services
serviceRegistry.getEnabledServices().forEach(service => {
  app.use(`/${service.name}`, createServiceProxy(service.name));
  logger.info(`Proxy route configured for service: ${service.name}`);
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  logger.info(`Reverse proxy server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

export default app; 