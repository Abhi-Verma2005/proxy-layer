import { Request } from 'express';
// Common types used across the application
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthHeaders {
  [key: string]: string;
}

export interface ProxyRequest extends Request {
  user?: User;
  authHeaders?: AuthHeaders;
  serviceConfig?: ServiceConfig;
}

export interface ServiceConfig {
  name: string;
  baseUrl: string;
  authStrategy: AuthStrategyType;
  enabled: boolean;
  settings?: Record<string, any>;
}

export type AuthStrategyType = 'header' | 'oauth' | 'jwt' | 'cookie' | 'custom'; 