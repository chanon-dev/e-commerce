import { Injectable, Logger } from '@nestjs/common';
import { ServiceRegistryService } from './service-registry.service';

export enum LoadBalancingStrategy {
  ROUND_ROBIN = 'round_robin',
  LEAST_CONNECTIONS = 'least_connections',
  WEIGHTED_ROUND_ROBIN = 'weighted_round_robin',
  RANDOM = 'random',
  HEALTH_BASED = 'health_based',
}

export interface ServiceInstance {
  url: string;
  weight: number;
  connections: number;
  responseTime: number;
  isHealthy: boolean;
  lastUsed: Date;
}

@Injectable()
export class LoadBalancerService {
  private readonly logger = new Logger(LoadBalancerService.name);
  private readonly serviceInstances: Map<string, ServiceInstance[]> = new Map();
  private readonly roundRobinCounters: Map<string, number> = new Map();
  private readonly strategy: LoadBalancingStrategy = LoadBalancingStrategy.HEALTH_BASED;

  constructor(private readonly serviceRegistry: ServiceRegistryService) {
    this.initializeServiceInstances();
  }

  private initializeServiceInstances(): void {
    const services = this.serviceRegistry.getAllServices();
    
    services.forEach(service => {
      // For now, each service has one instance
      // In production, this would be populated from service discovery
      const instances: ServiceInstance[] = [
        {
          url: service.url,
          weight: 1,
          connections: 0,
          responseTime: 0,
          isHealthy: true,
          lastUsed: new Date(),
        },
      ];

      this.serviceInstances.set(service.name, instances);
      this.roundRobinCounters.set(service.name, 0);
    });

    this.logger.log('Load balancer initialized with service instances');
  }

  async getServiceUrl(serviceName: string): Promise<string | null> {
    const instances = this.serviceInstances.get(serviceName);
    if (!instances || instances.length === 0) {
      this.logger.warn(`No instances found for service: ${serviceName}`);
      return null;
    }

    // Update instance health status
    await this.updateInstanceHealth(serviceName, instances);

    // Filter healthy instances
    const healthyInstances = instances.filter(instance => instance.isHealthy);
    if (healthyInstances.length === 0) {
      this.logger.warn(`No healthy instances found for service: ${serviceName}`);
      return null;
    }

    // Select instance based on strategy
    const selectedInstance = this.selectInstance(serviceName, healthyInstances);
    if (!selectedInstance) {
      return null;
    }

    // Update instance metrics
    selectedInstance.connections++;
    selectedInstance.lastUsed = new Date();

    this.logger.debug(`Selected instance for ${serviceName}: ${selectedInstance.url}`);
    return selectedInstance.url;
  }

  private async updateInstanceHealth(serviceName: string, instances: ServiceInstance[]): Promise<void> {
    const serviceStatus = this.serviceRegistry.getServiceStatus(serviceName);
    
    instances.forEach(instance => {
      if (serviceStatus && instance.url === serviceStatus.url) {
        instance.isHealthy = serviceStatus.status === 'healthy';
        instance.responseTime = serviceStatus.responseTime;
      }
    });
  }

  private selectInstance(serviceName: string, instances: ServiceInstance[]): ServiceInstance | null {
    switch (this.strategy) {
      case LoadBalancingStrategy.ROUND_ROBIN:
        return this.selectRoundRobin(serviceName, instances);
      
      case LoadBalancingStrategy.LEAST_CONNECTIONS:
        return this.selectLeastConnections(instances);
      
      case LoadBalancingStrategy.WEIGHTED_ROUND_ROBIN:
        return this.selectWeightedRoundRobin(serviceName, instances);
      
      case LoadBalancingStrategy.RANDOM:
        return this.selectRandom(instances);
      
      case LoadBalancingStrategy.HEALTH_BASED:
        return this.selectHealthBased(instances);
      
      default:
        return instances[0];
    }
  }

  private selectRoundRobin(serviceName: string, instances: ServiceInstance[]): ServiceInstance {
    const counter = this.roundRobinCounters.get(serviceName) || 0;
    const selectedIndex = counter % instances.length;
    
    this.roundRobinCounters.set(serviceName, counter + 1);
    
    return instances[selectedIndex];
  }

  private selectLeastConnections(instances: ServiceInstance[]): ServiceInstance {
    return instances.reduce((least, current) => 
      current.connections < least.connections ? current : least
    );
  }

  private selectWeightedRoundRobin(serviceName: string, instances: ServiceInstance[]): ServiceInstance {
    const totalWeight = instances.reduce((sum, instance) => sum + instance.weight, 0);
    const counter = this.roundRobinCounters.get(serviceName) || 0;
    
    let weightSum = 0;
    const targetWeight = (counter % totalWeight) + 1;
    
    for (const instance of instances) {
      weightSum += instance.weight;
      if (weightSum >= targetWeight) {
        this.roundRobinCounters.set(serviceName, counter + 1);
        return instance;
      }
    }
    
    return instances[0];
  }

  private selectRandom(instances: ServiceInstance[]): ServiceInstance {
    const randomIndex = Math.floor(Math.random() * instances.length);
    return instances[randomIndex];
  }

  private selectHealthBased(instances: ServiceInstance[]): ServiceInstance {
    // Sort by response time (ascending) and connections (ascending)
    const sortedInstances = [...instances].sort((a, b) => {
      const responseTimeDiff = a.responseTime - b.responseTime;
      if (responseTimeDiff !== 0) {
        return responseTimeDiff;
      }
      return a.connections - b.connections;
    });

    return sortedInstances[0];
  }

  addServiceInstance(serviceName: string, url: string, weight: number = 1): void {
    const instances = this.serviceInstances.get(serviceName) || [];
    
    const newInstance: ServiceInstance = {
      url,
      weight,
      connections: 0,
      responseTime: 0,
      isHealthy: true,
      lastUsed: new Date(),
    };

    instances.push(newInstance);
    this.serviceInstances.set(serviceName, instances);

    this.logger.log(`Added new instance for ${serviceName}: ${url}`);
  }

  removeServiceInstance(serviceName: string, url: string): void {
    const instances = this.serviceInstances.get(serviceName);
    if (!instances) {
      return;
    }

    const filteredInstances = instances.filter(instance => instance.url !== url);
    this.serviceInstances.set(serviceName, filteredInstances);

    this.logger.log(`Removed instance for ${serviceName}: ${url}`);
  }

  updateInstanceWeight(serviceName: string, url: string, weight: number): void {
    const instances = this.serviceInstances.get(serviceName);
    if (!instances) {
      return;
    }

    const instance = instances.find(inst => inst.url === url);
    if (instance) {
      instance.weight = weight;
      this.logger.log(`Updated weight for ${serviceName} instance ${url}: ${weight}`);
    }
  }

  releaseConnection(serviceName: string, url: string): void {
    const instances = this.serviceInstances.get(serviceName);
    if (!instances) {
      return;
    }

    const instance = instances.find(inst => inst.url === url);
    if (instance && instance.connections > 0) {
      instance.connections--;
    }
  }

  getLoadBalancerStats(): Record<string, any> {
    const stats: Record<string, any> = {};

    this.serviceInstances.forEach((instances, serviceName) => {
      const totalConnections = instances.reduce((sum, inst) => sum + inst.connections, 0);
      const healthyInstances = instances.filter(inst => inst.isHealthy).length;
      const avgResponseTime = instances.length > 0 
        ? instances.reduce((sum, inst) => sum + inst.responseTime, 0) / instances.length 
        : 0;

      stats[serviceName] = {
        totalInstances: instances.length,
        healthyInstances,
        totalConnections,
        averageResponseTime: Math.round(avgResponseTime),
        strategy: this.strategy,
        instances: instances.map(inst => ({
          url: inst.url,
          weight: inst.weight,
          connections: inst.connections,
          responseTime: inst.responseTime,
          isHealthy: inst.isHealthy,
          lastUsed: inst.lastUsed,
        })),
      };
    });

    return stats;
  }

  getServiceInstances(serviceName: string): ServiceInstance[] {
    return this.serviceInstances.get(serviceName) || [];
  }

  getAllServiceInstances(): Record<string, ServiceInstance[]> {
    const allInstances: Record<string, ServiceInstance[]> = {};
    
    this.serviceInstances.forEach((instances, serviceName) => {
      allInstances[serviceName] = [...instances];
    });

    return allInstances;
  }

  // Cleanup connections that haven't been used recently
  cleanupStaleConnections(): void {
    const staleThreshold = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes

    this.serviceInstances.forEach((instances, serviceName) => {
      instances.forEach(instance => {
        if (instance.lastUsed < staleThreshold && instance.connections > 0) {
          this.logger.debug(`Cleaning up stale connections for ${serviceName} instance ${instance.url}`);
          instance.connections = Math.max(0, instance.connections - 1);
        }
      });
    });
  }

  // Health check for load balancer
  isHealthy(): boolean {
    let totalServices = 0;
    let healthyServices = 0;

    this.serviceInstances.forEach((instances, serviceName) => {
      totalServices++;
      const hasHealthyInstance = instances.some(inst => inst.isHealthy);
      if (hasHealthyInstance) {
        healthyServices++;
      }
    });

    // Consider healthy if at least 50% of services have healthy instances
    return totalServices === 0 || (healthyServices / totalServices) >= 0.5;
  }
}
