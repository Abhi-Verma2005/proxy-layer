import { Request, Response, NextFunction } from 'express';
import { serviceRegistry } from '../services/registry/ServiceRegistry';
import { outlineService } from '../services/outline/OutlineService';
import { logger } from '../utils/logger';

/**
 * Authentication middleware
 * Handles authentication for all services based on their configured strategy
 */
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract service name from request (could be from subdomain, path, or header)
    const serviceName = extractServiceName(req);
    if (!serviceName) {
      return res.status(400).json({ error: 'Service not specified' });
    }
    // Get service configuration
    const service = serviceRegistry.getService(serviceName);
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    // Get authentication strategy for this service
    const strategy = serviceRegistry.getStrategy(service.authStrategy);
    if (!strategy) {
      return res.status(500).json({ error: 'Authentication strategy not available' });
    }
    // Extract token from request
    const token = req.headers.authorization?.replace('Bearer ', '');
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
  const pathSegments = req.path.split('/').filter(Boolean);
  if (pathSegments.length === 0) {
    return null;
  }
  // First path segment is the service name
  return pathSegments[0];
} 