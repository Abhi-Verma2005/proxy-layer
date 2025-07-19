import { Request, Response, NextFunction } from 'express';
import { serviceRegistry } from '@/services/registry/ServiceRegistry';
import { outlineService } from '@/services/outline/OutlineService';
import { logger } from '@/utils/logger';

/**
 * Authentication middleware
 * Handles authentication for all services based on their configured strategy
 */
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  logger.debug(`🚀 Auth middleware called`);
  logger.debug(`🚀 Request details:`, {
    method: req.method,
    url: req.url,
    originalUrl: (req as any).originalUrl,
    path: req.path,
    baseUrl: req.baseUrl,
    headers: Object.keys(req.headers)
  });
  
  try {
    // Extract service name from request (could be from subdomain, path, or header)
    const serviceName = extractServiceName(req);
    logger.debug(`🔍 Auth middleware - extracted service name: "${serviceName}"`);
    logger.debug(`🔍 Auth middleware - request path: "${req.path}"`);
    logger.debug(`🔍 Auth middleware - request originalUrl: "${(req as any).originalUrl}"`);
    logger.debug(`🔍 Auth middleware - request baseUrl: "${req.baseUrl}"`);
    
    if (!serviceName) {
      logger.error(`❌ Auth middleware - no service name extracted from path: "${req.path}"`);
      logger.error(`❌ Auth middleware - full request details:`, {
        method: req.method,
        url: req.url,
        originalUrl: (req as any).originalUrl,
        path: req.path,
        baseUrl: req.baseUrl
      });
      return res.status(400).json({ error: 'Service not specified' });
    }
    // Get service configuration
    logger.debug(`🔍 Auth middleware - looking up service: "${serviceName}"`);
    const service = serviceRegistry.getService(serviceName);
    logger.debug(`🔍 Auth middleware - service lookup result: ${service ? 'found' : 'not found'}`);
    
    if (service) {
      logger.debug(`🔍 Auth middleware - service details:`, {
        name: service.name,
        displayName: service.displayName,
        enabled: service.enabled,
        authStrategy: service.authStrategy
      });
    }
    
    if (!service) {
      logger.error(`❌ Auth middleware - service not found: "${serviceName}"`);
      logger.error(`❌ Auth middleware - available services:`, serviceRegistry.getEnabledServices().map(s => s.name));
      return res.status(404).json({ error: 'Service not found' });
    }
    // Get authentication strategy for this service
    logger.debug(`🔍 Auth middleware - looking up auth strategy: "${service.authStrategy}"`);
    const strategy = serviceRegistry.getStrategy(service.authStrategy);
    logger.debug(`🔍 Auth middleware - auth strategy lookup result: ${strategy ? 'found' : 'not found'}`);
    
    if (!strategy) {
      logger.error(`❌ Auth middleware - authentication strategy not available: "${service.authStrategy}"`);
      return res.status(500).json({ error: 'Authentication strategy not available' });
    }
    // Extract token from request - check multiple sources
    let token = req.headers.authorization?.replace('Bearer ', '');
    
    // If no token in header, check query parameter
    if (!token && req.query.token) {
      token = req.query.token as string;
      logger.debug(`🔍 Auth middleware - found token in query parameter`);
    }
    
    // If no token in query, check cookie
    if (!token && req.cookies && req.cookies['sb-access-token']) {
      token = req.cookies['sb-access-token'];
      logger.debug(`🔍 Auth middleware - found token in cookie`);
    }
    
    logger.debug(`🔍 Auth middleware - token source: ${token ? 'found' : 'not found'}`);
    // Authenticate user
    const authResult = await strategy.authenticate({
      token,
      service: serviceName,
      originalRequest: req
    });
    if (!authResult.success) {
      return res.status(401).json({ error: authResult.error });
    }
    // Service-specific user handling
    let serviceUser = authResult.user!;
    if (serviceName === 'outline') {
      // Ensure user exists in Outline database
      serviceUser = await outlineService.ensureUser(authResult.user!);
    }
    // TODO: Add handling for other services as they're implemented
    // Generate service-specific headers
    const authHeaders = strategy.generateHeaders(serviceUser, serviceName);
    // Attach to request object
    (req as any).user = serviceUser;
    (req as any).authHeaders = authHeaders;
    (req as any).serviceConfig = service;
    logger.info(`Authenticated user ${serviceUser.email} for service ${serviceName}`);
    next();
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    res.status(500).json({ error: 'Internal authentication error' });
  }
};

/**
 * Extract service name from request
 * Currently supports path-based routing: /outline/*, /notion/*, etc.
 */
function extractServiceName(req: Request): string | null {
  // Use baseUrl to get the service name since req.path gets modified by Express routing
  const servicePath = req.baseUrl || (req as any).originalUrl?.split('/')[1];
  logger.debug(`🔍 extractServiceName - input path: "${req.path}"`);
  logger.debug(`🔍 extractServiceName - baseUrl: "${req.baseUrl}"`);
  logger.debug(`🔍 extractServiceName - originalUrl: "${(req as any).originalUrl}"`);
  logger.debug(`🔍 extractServiceName - servicePath: "${servicePath}"`);
  
  if (!servicePath) {
    logger.debug(`🔍 extractServiceName - no service path found`);
    return null;
  }
  
  // Remove leading slash if present
  const serviceName = servicePath.startsWith('/') ? servicePath.substring(1) : servicePath;
  logger.debug(`🔍 extractServiceName - extracted service name: "${serviceName}"`);
  
  return serviceName;
} 