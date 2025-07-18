import { ServiceDefinition } from '../types/services';

// Service definitions - only Outline is fully configured
export const serviceDefinitions: ServiceDefinition[] = [
  {
    name: 'outline',
    displayName: 'Outline Docs',
    baseUrl: process.env.OUTLINE_DATABASE_URL || 'http://localhost:3000',
    authStrategy: 'header',
    proxyConfig: {
      target: process.env.OUTLINE_DATABASE_URL || 'http://localhost:3000',
      changeOrigin: true,
      secure: false,
      headers: {
        'X-Forwarded-Proto': 'https'
      }
    },
    healthCheck: {
      path: '/health',
      interval: 30000,
      timeout: 5000
    },
    enabled: true
  },
  // Future services - structure only, not functional
  {
    name: 'notion',
    displayName: 'Notion Workspace',
    baseUrl: process.env.NOTION_BASE_URL || '',
    authStrategy: 'oauth', // Will use OAuth strategy
    proxyConfig: {
      target: process.env.NOTION_BASE_URL || '',
      changeOrigin: true,
      secure: true
    },
    enabled: false // Disabled until implemented
  },
  {
    name: 'slack',
    displayName: 'Slack Integration',
    baseUrl: process.env.SLACK_BASE_URL || '',
    authStrategy: 'jwt', // Will use JWT strategy
    proxyConfig: {
      target: process.env.SLACK_BASE_URL || '',
      changeOrigin: true,
      secure: true
    },
    enabled: false // Disabled until implemented
  }
]; 