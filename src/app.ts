// Load environment variables first
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Import middleware and services
import { authMiddleware } from '@/middleware/auth';
import { createServiceProxy } from '@/middleware/proxy';
import { oauthCallbackMiddleware } from '@/middleware/sessionCheck';
import { serviceRegistry } from '@/services/registry/ServiceRegistry';
import { logger } from '@/utils/logger';

// Log environment status
logger.info('Environment loaded:', {
  nodeEnv: process.env.NODE_ENV,
  port: process.env.PORT || 8000,
  hasSupabaseUrl: !!process.env.SUPABASE_URL,
  allowedOrigins: process.env.ALLOWED_ORIGINS
});

const app: express.Express = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3001', 'http://localhost:3000'],
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

// Test endpoint - bypass auth for testing
app.get('/test-outline', (req, res) => {
  res.json({ 
    message: 'Test endpoint - proxy should work',
    service: 'outline',
    target: 'http://localhost:3000'
  });
});

// OAuth callback route (must be before proxy routes)
app.use('/outline/oauth/callback', oauthCallbackMiddleware);

// Setup proxy routes for all enabled services with authentication
// Ensure service registry is initialized
const enabledServices = serviceRegistry.getEnabledServices();

// Log all registered service names for debugging
logger.info('🔍 All registered service names:', enabledServices.map(s => s.name));
logger.info('🔍 Total enabled services:', enabledServices.length);

enabledServices.forEach(service => {
  // Validate service name before mounting
  if (!/^[a-zA-Z0-9-_]+$/.test(service.name)) {
    logger.error(`❌ Invalid service name: "${service.name}" — skipping mount`);
    return;
  }
  
  // Additional validation for common problematic patterns
  if (service.name.startsWith(':') || service.name.includes('/') || service.name.includes('\\')) {
    logger.error(`❌ Invalid service name: "${service.name}" contains invalid characters — skipping mount`);
    return;
  }
  
  // FIXED: Use simple route pattern without wildcard to avoid path-to-regexp issues
  const routePattern = `/${service.name}`;
  logger.debug(`🛣️  Mounting route pattern: ${routePattern}`);
  
  const proxyMiddleware = createServiceProxy(service.name);
  
  // Handle both single middleware and array of middleware
  if (Array.isArray(proxyMiddleware)) {
    // Mount auth middleware first, then all proxy middlewares
    app.use(routePattern, authMiddleware, ...proxyMiddleware);
    logger.info(`✅ Proxy route configured for service: ${service.name} at ${routePattern} (with redirect)`);
  } else {
    // Legacy single middleware support
    app.use(routePattern, authMiddleware, proxyMiddleware);
    logger.info(`✅ Proxy route configured for service: ${service.name} at ${routePattern}`);
  }
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const duration = Date.now() - (req as any).startTime;
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    duration: `${duration}ms`,
    userAgent: req.get('User-Agent')
  });
  
  res.status(err.status || 500).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message 
  });
});

// FIXED: 404 handler - use middleware function instead of route pattern
app.use((req, res) => {
  logger.warn(`Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    error: 'Route not found',
    method: req.method,
    path: req.originalUrl
  });
});

// Start server with error handling
const PORT = process.env.PORT || 8000;

const server = app.listen(PORT, () => {
  logger.info(`🚀 Reverse proxy server running on port ${PORT}`);
  logger.info(`📊 Health check available at: http://localhost:${PORT}/health`);
  logger.info(`📋 Services status at: http://localhost:${PORT}/services`);
  
  // Log enabled services
  const enabledServices = serviceRegistry.getEnabledServices();
  if (enabledServices.length > 0) {
    logger.info('🔗 Enabled services:', enabledServices.map(s => s.name).join(', '));
  } else {
    logger.warn('⚠️  No services are currently enabled');
  }
}).on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    logger.error(`❌ Port ${PORT} is already in use`);
  } else {
    logger.error('❌ Server startup error:', err);
  }
  process.exit(1);
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