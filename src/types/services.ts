import { AuthStrategyType } from './index';

export interface ServiceDefinition {
  name: string;
  displayName: string;
  baseUrl: string;
  authStrategy: AuthStrategyType;
  proxyConfig: ProxyConfig;
  healthCheck?: HealthCheckConfig;
  enabled: boolean;
}

export interface ProxyConfig {
  target: string;
  changeOrigin: boolean;
  secure: boolean;
  pathRewrite?: Record<string, string>;
  headers?: Record<string, string>;
}

export interface HealthCheckConfig {
  path: string;
  interval: number;
  timeout: number;
}

// Service status for monitoring
export interface ServiceStatus {
  name: string;
  healthy: boolean;
  lastCheck: Date;
  responseTime?: number;
  error?: string;
} 