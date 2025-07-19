import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import { serviceRegistry } from '@/services/registry/ServiceRegistry';
import { logger } from '@/utils/logger';
import { Request, Response, NextFunction } from 'express';
import { sessionCheckMiddleware } from './sessionCheck';

/**
 * Create proxy middleware for a specific service
 */
export const createServiceProxy = (serviceName: string) => {
  logger.debug(`🔍 Starting createServiceProxy for: ${serviceName}`);
  
  const service = serviceRegistry.getService(serviceName);
  
  if (!service) {
    logger.error(`❌ Service ${serviceName} not found in registry`);
    throw new Error(`Service ${serviceName} not found`);
  }
  
  // Validate target URL
  const proxyConfig = service?.proxyConfig;
  const targetUrl = proxyConfig?.target;
  
  if (!targetUrl || typeof targetUrl !== 'string' || !targetUrl.startsWith('http')) {
    logger.error(`❌ Invalid target URL for service ${serviceName}: ${targetUrl}`);
    throw new Error(`Invalid target URL for service ${serviceName}: ${targetUrl}`);
  }
  
  logger.info(`✅ Creating proxy for ${serviceName} with target: ${targetUrl}`);
  
  // Create middleware that handles redirects for root path
  const redirectMiddleware = (req: Request, res: Response, next: NextFunction) => {
    // Check if this is a root path request (just /outline, /notion, etc.)
    const isRootPath = req.path === '/' || req.path === '';
    
    if (isRootPath) {
      logger.info(`🔄 Redirecting root path for ${serviceName} to ${targetUrl}`);
      return res.redirect(targetUrl);
    }
    
    next();
  };
  
  const proxyOptions: Options = {
    target: targetUrl,
    changeOrigin: proxyConfig?.changeOrigin ?? true,
    secure: proxyConfig?.secure ?? false,
    pathRewrite: {
      [`^/${serviceName}(.*)`]: '$1' // rewrites /outline/api → /api, /outline → /
    },
    on: {
      proxyReq: (proxyReq, req, res) => {
        // Remove token from query parameters to avoid passing it to target service
        const url = new URL(proxyReq.path, targetUrl);
        url.searchParams.delete('token');
        proxyReq.path = url.pathname + url.search;
        
        // Add start time for response time tracking
        (req as any).startTime = Date.now();
        
        try {
          // Inject authentication headers
          const authHeaders = (req as any).authHeaders;
          if (authHeaders) {
            logger.debug(`🔐 Injecting auth headers:`, Object.keys(authHeaders));
            Object.entries(authHeaders).forEach(([key, value]) => {
              proxyReq.setHeader(key, value as string);
              logger.debug(`🔐 Set header: ${key} = ${value}`);
            });
          } else {
            logger.debug(`⚠️  No auth headers to inject`);
          }
          
          // Add service-specific headers
          if (proxyConfig?.headers) {
            logger.debug(`📋 Injecting service headers:`, Object.keys(proxyConfig.headers));
            Object.entries(proxyConfig.headers).forEach(([key, value]) => {
              proxyReq.setHeader(key, value as string);
              logger.debug(`📋 Set header: ${key} = ${value}`);
            });
          }
          
          // Log all final headers being sent to target
          logger.debug(`📤 Final request headers to ${targetUrl}:`, Object.keys(proxyReq.getHeaders()));
          
          logger.info(`📡 Proxying ${req.method} ${(req as any).originalUrl} to ${targetUrl}${proxyReq.path}`);
        } catch (error) {
          logger.error(`❌ ProxyReq error:`, error);
        }
      },
      
      proxyRes: (proxyRes, req, res) => {
        const responseTime = Date.now() - ((req as any).startTime || Date.now());
        logger.info(`${serviceName} response: ${proxyRes.statusCode} (${responseTime}ms)`);
        
        try {
          serviceRegistry.updateServiceStatus(serviceName, {
            name: serviceName,
            healthy: proxyRes.statusCode! < 500,
            lastCheck: new Date(),
            responseTime
          });
        } catch (error) {
          logger.error(`❌ Error updating service status:`, error);
        }
      },
      
      error: (err, req, res) => {
        logger.error(`💥 Proxy error for ${serviceName}:`, err.message);
        
        try {
          serviceRegistry.updateServiceStatus(serviceName, {
            name: serviceName,
            healthy: false,
            lastCheck: new Date(),
            error: (err as Error).message
          });
        } catch (statusError) {
          logger.error(`❌ Error updating service status:`, statusError);
        }
        
        // Ensure response hasn't been sent already
        if (!(res as any).headersSent) {
          (res as any).status(502).json({ 
            error: 'Service temporarily unavailable',
            service: serviceName,
            message: (err as Error).message 
          });
        }
      }
    }
  };
  
  logger.debug(`🏗️ Proxy options built:`, {
    target: proxyOptions.target,
    changeOrigin: proxyOptions.changeOrigin,
    secure: proxyOptions.secure,
    hasPathRewrite: !!proxyOptions.pathRewrite
  });
  
  try {
    const proxyMiddleware = createProxyMiddleware(proxyOptions);
    logger.info(`✅ Proxy middleware created successfully for ${serviceName}`);
    
    // Return middleware chain based on service type
    if (serviceName === 'outline') {
      // For Outline: [sessionCheck, redirect, proxy]
      return [sessionCheckMiddleware, redirectMiddleware, proxyMiddleware];
    } else {
      // For other services: [redirect, proxy]
      return [redirectMiddleware, proxyMiddleware];
    }
  } catch (error) {
    logger.error(`❌ Failed to create proxy middleware for ${serviceName}:`, error);
    throw error;
  }
};