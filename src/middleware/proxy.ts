import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import { serviceRegistry } from '../services/registry/ServiceRegistry';
import { logger } from '../utils/logger';

/**
 * Create proxy middleware for a specific service
 */
export const createServiceProxy = (serviceName: string) => {
  const service = serviceRegistry.getService(serviceName);
  if (!service) {
    throw new Error(`Service ${serviceName} not found`);
  }
  const proxyOptions: Options = {
    target: service.proxyConfig.target,
    changeOrigin: service.proxyConfig.changeOrigin,
    secure: service.proxyConfig.secure,
    pathRewrite: {
      [`^/${serviceName}`]: '', // Remove service prefix from path
      ...service.proxyConfig.pathRewrite
    },
    on: {
      proxyReq: (proxyReq, req, res) => {
        // Inject authentication headers
        const authHeaders = (req as any).authHeaders;
        if (authHeaders) {
          Object.entries(authHeaders).forEach(([key, value]) => {
            proxyReq.setHeader(key, value as string);
          });
        }
        // Add service-specific headers
        if (service.proxyConfig.headers) {
          Object.entries(service.proxyConfig.headers).forEach(([key, value]) => {
            proxyReq.setHeader(key, value as string);
          });
        }
        // Enhanced logging for debugging
        const user = (req as any).user;
        const injectedHeaders = authHeaders ? Object.keys(authHeaders) : [];
        logger.info(
          `Proxying ${req.method} ${(req as any).originalUrl} to ${service.proxyConfig.target}${(req as any).originalUrl.replace(`/${serviceName}`, '')}` +
          (user ? ` | user: ${user.email}` : '') +
          (injectedHeaders.length ? ` | injected headers: ${injectedHeaders.join(', ')}` : '')
        );
      },
      proxyRes: (proxyRes, req, res) => {
        // Log response
        logger.info(`${serviceName} response: ${proxyRes.statusCode} for ${(req as any).path}`);
        // Update service status
        serviceRegistry.updateServiceStatus(serviceName, {
          name: serviceName,
          healthy: proxyRes.statusCode! < 500,
          lastCheck: new Date(),
          responseTime: Date.now() - (req as any).startTime
        });
      },
      error: (err, req, res) => {
        logger.error(`${serviceName} proxy error:`, err);
        // Update service status
        serviceRegistry.updateServiceStatus(serviceName, {
          name: serviceName,
          healthy: false,
          lastCheck: new Date(),
          error: (err as Error).message
        });
        (res as any).status(500).json({ error: 'Service temporarily unavailable' });
      }
    }
  };
  return createProxyMiddleware(proxyOptions);
}; 