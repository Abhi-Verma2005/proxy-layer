import { ServiceDefinition, ServiceStatus } from '@/types/services';
import { IAuthStrategy } from '@/types/auth';
import { serviceDefinitions } from '@/config/services';
import { HeaderAuthStrategy } from '@/strategies/header/HeaderAuthStrategy';
import { OAuthStrategy } from '@/strategies/oauth/OAuthStrategy';
import { JWTStrategy } from '@/strategies/jwt/JWTStrategy';
import { logger } from '@/utils/logger';

/**
 * Central service registry
 * Manages all integrated services and their configurations
 */
export class ServiceRegistry {
  private services: Map<string, ServiceDefinition> = new Map();
  private strategies: Map<string, IAuthStrategy> = new Map();
  private statusMap: Map<string, ServiceStatus> = new Map();

  constructor() {
    this.initializeStrategies();
    this.loadServices();
  }

  /**
   * Initialize available authentication strategies
   */
  private initializeStrategies(): void {
    this.strategies.set('header', new HeaderAuthStrategy());
    this.strategies.set('oauth', new OAuthStrategy());
    this.strategies.set('jwt', new JWTStrategy());
    logger.info('Authentication strategies initialized');
  }

  /**
   * Load service definitions from configuration
   */
  private loadServices(): void {
    logger.debug(`🔍 Loading services from config...`);
    logger.debug(`🔍 Total service definitions: ${serviceDefinitions.length}`);
    
    serviceDefinitions.forEach((service, index) => {
      logger.debug(`🔍 Processing service ${index + 1}: ${service.name} (enabled: ${service.enabled})`);
      
      if (service.enabled) {
        // Validate service name before registration
        if (!this.isValidServiceName(service.name)) {
          logger.error(`❌ Invalid service name "${service.name}" - skipping registration`);
          return;
        }
        
        this.services.set(service.name, service);
        logger.info(`✅ Service registered: ${service.name}`);
      } else {
        logger.debug(`⏭️  Skipping disabled service: ${service.name}`);
      }
    });
    
    logger.debug(`🔍 Final registered services: ${Array.from(this.services.keys()).join(', ')}`);
  }

  /**
   * Validate service name for path-to-regexp compatibility
   */
  private isValidServiceName(name: string): boolean {
    // Must be non-empty
    if (!name || name.trim() === '') {
      return false;
    }
    
    // Must match valid path segment pattern
    const validPattern = /^[a-zA-Z0-9-_]+$/;
    return validPattern.test(name);
  }

  /**
   * Get service definition by name
   */
  public getService(name: string): ServiceDefinition | undefined {
    return this.services.get(name);
  }

  /**
   * Get authentication strategy by name
   */
  public getStrategy(name: string): IAuthStrategy | undefined {
    return this.strategies.get(name);
  }

  /**
   * Get all enabled services
   */
  public getEnabledServices(): ServiceDefinition[] {
    return Array.from(this.services.values());
  }

  /**
   * Check if service is enabled and available
   */
  public isServiceAvailable(name: string): boolean {
    const service = this.services.get(name);
    return service?.enabled === true;
  }

  /**
   * Update service status (for health monitoring)
   */
  public updateServiceStatus(name: string, status: ServiceStatus): void {
    this.statusMap.set(name, status);
  }

  /**
   * Get service status
   */
  public getServiceStatus(name: string): ServiceStatus | undefined {
    return this.statusMap.get(name);
  }

  /**
   * Get all service statuses
   */
  public getAllStatuses(): ServiceStatus[] {
    return Array.from(this.statusMap.values());
  }
}

// Export singleton instance
export const serviceRegistry = new ServiceRegistry(); 