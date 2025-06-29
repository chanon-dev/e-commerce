// Order Service - User Service Client (Independent Communication)
import { ServiceHttpClient, ServiceClientFactory, ServiceDiscovery } from '../../../shared/communication/http-client';
import { UserServiceAPI, UserResponse, AddressResponse } from '../../../shared/api-contracts/user-service';

export class UserServiceClient implements UserServiceAPI {
  private client: ServiceHttpClient;

  constructor() {
    // Discover user service configuration
    const userServiceConfig = ServiceDiscovery.discover('user-service');
    if (!userServiceConfig) {
      throw new Error('User service not found in service registry');
    }

    this.client = ServiceClientFactory.createClient('user-service', userServiceConfig);
  }

  async getUser(userId: string): Promise<UserResponse> {
    try {
      return await this.client.get<UserResponse>(`/api/v1/users/${userId}`);
    } catch (error: any) {
      if (error.statusCode === 404) {
        throw new UserNotFoundError(`User ${userId} not found`);
      }
      throw new UserServiceError(`Failed to get user ${userId}: ${error.message}`);
    }
  }

  async getUserByEmail(email: string): Promise<UserResponse> {
    try {
      return await this.client.get<UserResponse>(`/api/v1/users/by-email/${encodeURIComponent(email)}`);
    } catch (error: any) {
      if (error.statusCode === 404) {
        throw new UserNotFoundError(`User with email ${email} not found`);
      }
      throw new UserServiceError(`Failed to get user by email ${email}: ${error.message}`);
    }
  }

  async getUserAddresses(userId: string): Promise<AddressResponse[]> {
    try {
      return await this.client.get<AddressResponse[]>(`/api/v1/users/${userId}/addresses`);
    } catch (error: any) {
      if (error.statusCode === 404) {
        throw new UserNotFoundError(`User ${userId} not found`);
      }
      throw new UserServiceError(`Failed to get user addresses for ${userId}: ${error.message}`);
    }
  }

  // Only implement methods needed by Order Service
  async updateUser(): Promise<UserResponse> {
    throw new Error('Order Service should not update users directly');
  }

  async deleteUser(): Promise<void> {
    throw new Error('Order Service should not delete users directly');
  }

  async addUserAddress(): Promise<AddressResponse> {
    throw new Error('Order Service should not add user addresses directly');
  }

  async updateUserAddress(): Promise<AddressResponse> {
    throw new Error('Order Service should not update user addresses directly');
  }

  async deleteUserAddress(): Promise<void> {
    throw new Error('Order Service should not delete user addresses directly');
  }

  async getUserPreferences(): Promise<any> {
    throw new Error('Order Service should not access user preferences directly');
  }

  async updateUserPreferences(): Promise<any> {
    throw new Error('Order Service should not update user preferences directly');
  }

  async getUserWishlist(): Promise<any> {
    throw new Error('Order Service should not access user wishlist directly');
  }

  async addToWishlist(): Promise<void> {
    throw new Error('Order Service should not modify user wishlist directly');
  }

  async removeFromWishlist(): Promise<void> {
    throw new Error('Order Service should not modify user wishlist directly');
  }

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    return await this.client.healthCheck();
  }
}

// Custom error classes for Order Service context
export class UserServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserServiceError';
  }
}

export class UserNotFoundError extends UserServiceError {
  constructor(message: string) {
    super(message);
    this.name = 'UserNotFoundError';
  }
}

// Usage in Order Service
/*
export class OrderApplicationService {
  constructor(
    private userServiceClient: UserServiceClient,
    private orderRepository: OrderRepository,
    private eventBus: EventBus
  ) {}

  async createOrder(command: CreateOrderCommand): Promise<OrderDto> {
    // Validate user exists (external API call)
    const user = await this.userServiceClient.getUser(command.userId);
    
    // Get user addresses (external API call)
    const addresses = await this.userServiceClient.getUserAddresses(command.userId);
    
    // Create order with validated data
    const order = Order.create({
      userId: user.id,
      customerEmail: user.email,
      customerName: `${user.firstName} ${user.lastName}`,
      // ... other order data
    });

    // Save order (own database)
    await this.orderRepository.save(order);

    // Publish event (async communication)
    await this.eventBus.publish('order-events', {
      eventType: 'order.created',
      aggregateId: order.id,
      aggregateType: 'order',
      data: {
        orderId: order.id,
        userId: user.id,
        customerEmail: user.email,
        // ... other event data
      }
    });

    return OrderDto.fromEntity(order);
  }
}
*/
