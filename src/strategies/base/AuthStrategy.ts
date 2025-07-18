import { IAuthStrategy, AuthContext, AuthResult } from '../../types/auth';
import { User } from '../../types';

/**
 * Base authentication strategy class
 * All auth strategies must extend this class
 */
export abstract class BaseAuthStrategy implements IAuthStrategy {
  public abstract name: string;
  /**
   * Authenticate user based on the request context
   */
  public abstract authenticate(context: AuthContext): Promise<AuthResult>;
  /**
   * Generate service-specific headers for authenticated user
   */
  public abstract generateHeaders(user: User, service: string): Record<string, string>;
  /**
   * Validate strategy configuration
   */
  protected validateConfig(config: any): boolean {
    return config !== null && config !== undefined;
  }
  /**
   * Handle authentication errors consistently
   */
  protected handleError(error: any): AuthResult {
    return {
      success: false,
      error: error.message || 'Authentication failed'
    };
  }
} 