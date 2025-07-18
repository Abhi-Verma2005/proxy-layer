import { ServiceDefinition, ServiceStatus } from '../../types/services';
import { IAuthStrategy } from '../../types/auth';
import { serviceDefinitions } from '../../config/services';
import { HeaderAuthStrategy } from '../../strategies/header/HeaderAuthStrategy';
import { OAuthStrategy } from '../../strategies/oauth/OAuthStrategy';
import { JWTStrategy } from '../../strategies/jwt/JWTStrategy';
import { logger } from '../../utils/logger';

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
    serviceDefinitions.forEach(service => {
      if (service.enabled) {
        this.services.set(service.name, service);
        logger.info(`Service registered: ${service.name}`);
      }
    });
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