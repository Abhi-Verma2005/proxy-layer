import { Request, Response, NextFunction } from 'express';
import { outlineSessionService } from '@/services/outline/OutlineSessionService';
import { logger } from '@/utils/logger';

/**
 * Middleware to check Outline session status before redirecting
 * Validates cross-database sessions between main app and Outline
 */
export const sessionCheckMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  try {
    // Only apply to Outline service
    const serviceName = extractServiceName(req);
    logger.info(`🔍 Session check middleware called for service: ${serviceName}`);
    
    if (serviceName !== 'outline') {
      logger.debug(`⏭️  Skipping session check for non-outline service: ${serviceName}`);
      return next();
    }

    logger.info(`🔍 Session check middleware for Outline`);
    logger.debug(`📊 Request details:`, {
      method: req.method,
      url: req.url,
      originalUrl: (req as any).originalUrl,
      path: req.path,
      baseUrl: req.baseUrl,
      query: req.query
    });

    // Get user from request (set by auth middleware)
    const user = (req as any).user;
    if (!user) {
      logger.error('❌ No user found in request for session check');
      logger.debug(`📊 Request object keys:`, Object.keys(req));
      logger.debug(`📊 Request user object:`, (req as any).user);
      return res.status(401).json({ error: 'User not authenticated' });
    }

    logger.info(`✅ User found in request:`, {
      id: user.id,
      email: user.email,
      name: user.name
    });

    // Check if Outline session service is available
    if (!outlineSessionService.isAvailable()) {
      logger.warn('⚠️  Outline session service not available, skipping session check');
      logger.debug(`📊 Service availability check failed`);
      return next();
    }

    logger.info(`✅ Outline session service is available`);

    // Check user's Outline session status
    logger.info(`🔍 Starting cross-database session check for user: ${user.email}`);
    const sessionResult = await outlineSessionService.checkUserOutlineSession(user);
    
    const duration = Date.now() - startTime;
    logger.info(`✅ Session check completed in ${duration}ms`, {
      userExists: sessionResult.userExists,
      hasActiveSession: sessionResult.hasActiveSession,
      outlineUserId: sessionResult.outlineUserId,
      error: sessionResult.error
    });

    // Handle different scenarios
    if (!sessionResult.userExists) {
      logger.warn(`⚠️  User not found in Outline database: ${user.email}`);
      logger.debug(`📊 Session result details:`, sessionResult);
      // User doesn't exist in Outline - redirect to OAuth
      const oauthUrl = outlineSessionService.generateOAuthUrl(user);
      logger.info(`🔄 Redirecting to OAuth (user not found): ${oauthUrl}`);
      return res.redirect(oauthUrl);
    }

    if (!sessionResult.hasActiveSession) {
      logger.info(`🔄 No active Outline session for user: ${user.email}`);
      logger.debug(`📊 Session result details:`, sessionResult);
      // User exists but no active session - redirect to OAuth
      const oauthUrl = outlineSessionService.generateOAuthUrl(user);
      logger.info(`🔄 Redirecting to OAuth (no session): ${oauthUrl}`);
      return res.redirect(oauthUrl);
    }

    // User has active session - proceed to Outline
    logger.info(`✅ User has active Outline session: ${user.email}`);
    logger.debug(`📊 Session details:`, {
      sessionId: sessionResult.sessionData?.id,
      expiresAt: sessionResult.sessionData?.expiresAt,
      outlineUserId: sessionResult.outlineUserId
    });

    // Store session info in request for potential use
    (req as any).outlineSession = sessionResult.sessionData;
    (req as any).outlineUserId = sessionResult.outlineUserId;

    logger.info(`✅ Proceeding to Outline with active session`);
    next();

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`❌ Session check middleware error (${duration}ms):`, error);
    logger.error(`📊 Error details:`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      user: (req as any).user ? {
        id: (req as any).user.id,
        email: (req as any).user.email
      } : 'No user'
    });
    
    // On error, redirect to OAuth as fallback
    const user = (req as any).user;
    if (user) {
      const oauthUrl = outlineSessionService.generateOAuthUrl(user);
      logger.info(`🔄 Redirecting to OAuth (error fallback): ${oauthUrl}`);
      return res.redirect(oauthUrl);
    }
    
    // If no user, return error
    return res.status(500).json({ 
      error: 'Session check failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Extract service name from request
 */
function extractServiceName(req: Request): string | null {
  const servicePath = req.baseUrl || (req as any).originalUrl?.split('/')[1];
  
  if (!servicePath) {
    logger.debug(`🔍 No service path found in request`);
    return null;
  }
  
  // Remove leading slash if present
  const serviceName = servicePath.startsWith('/') ? servicePath.substring(1) : servicePath;
  logger.debug(`🔍 Extracted service name: "${serviceName}"`);
  
  return serviceName;
}

/**
 * OAuth callback middleware to handle OAuth redirects
 */
export const oauthCallbackMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Handle OAuth callback from Outline
  if (req.path === '/outline/oauth/callback') {
    logger.info('🔄 OAuth callback received');
    logger.debug(`📊 Callback details:`, {
      path: req.path,
      query: req.query,
      headers: Object.keys(req.headers)
    });
    
    const { state } = req.query;
    
    if (state) {
      try {
        const stateData = outlineSessionService.decryptState(state as string);
        logger.info(`✅ OAuth callback processed for user: ${stateData.email}`);
        logger.debug(`📊 State data:`, stateData);
        
        // Redirect to Outline with session
        const outlineUrl = process.env.OUTLINE_BASE_URL || 'http://localhost:3000';
        logger.info(`🔄 Redirecting to Outline after OAuth: ${outlineUrl}`);
        return res.redirect(outlineUrl);
        
      } catch (error) {
        logger.error('❌ Invalid OAuth callback state:', error);
        return res.status(400).json({ error: 'Invalid callback state' });
      }
    } else {
      logger.warn('⚠️  OAuth callback without state parameter');
      // Redirect to Outline anyway
      const outlineUrl = process.env.OUTLINE_BASE_URL || 'http://localhost:3000';
      return res.redirect(outlineUrl);
    }
  }
  
  next();
}; 