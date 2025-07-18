import { User, AuthStrategyType } from './index';

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
  headers?: Record<string, string>;
}

export interface AuthContext {
  token?: string;
  user?: User;
  service: string;
  originalRequest: any;
}

export interface AuthStrategyConfig {
  name: string;
  type: AuthStrategyType;
  settings: Record<string, any>;
}

// Auth strategy interface - all strategies must implement this
export interface IAuthStrategy {
  name: string;
  authenticate(context: AuthContext): Promise<AuthResult>;
  generateHeaders(user: User, service: string): Record<string, string>;
} 