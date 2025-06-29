// Order Service - User Service HTTP Client (NO SHARED CODE)
// Pure HTTP API calls with own type definitions

export class UserServiceClient {
  private readonly baseUrl: string;
  private readonly timeout: number = 5000;

  constructor() {
    this.baseUrl = process.env.USER_SERVICE_URL || 'http://user-service:3002';
  }

  // Own type definitions (NOT shared)
  interface UserData {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    isEmailVerified: boolean;
    status: string;
  }

  async getUser(userId: string): Promise<UserData> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/users/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Service-Name': 'order-service',
        },
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new UserNotFoundError(`User ${userId} not found`);
        }
        throw new UserServiceError(`HTTP ${response.status}: ${response.statusText}`);
      }

      const userData = await response.json();
      
      // Return data as-is (no type conversion needed)
      return {
        id: userData.id,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        isEmailVerified: userData.isEmailVerified,
        status: userData.status,
      };
    } catch (error) {
      if (error instanceof UserNotFoundError || error instanceof UserServiceError) {
        throw error;
      }
      
      if (error.name === 'AbortError') {
        throw new UserServiceError('User service request timeout');
      }
      
      throw new UserServiceError(`Failed to get user: ${error.message}`);
    }
  }

  async getUserByEmail(email: string): Promise<UserData> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/users/by-email/${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Service-Name': 'order-service',
        },
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new UserNotFoundError(`User with email ${email} not found`);
        }
        throw new UserServiceError(`HTTP ${response.status}: ${response.statusText}`);
      }

      const userData = await response.json();
      
      return {
        id: userData.id,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        isEmailVerified: userData.isEmailVerified,
        status: userData.status,
      };
    } catch (error) {
      if (error instanceof UserNotFoundError || error instanceof UserServiceError) {
        throw error;
      }
      
      if (error.name === 'AbortError') {
        throw new UserServiceError('User service request timeout');
      }
      
      throw new UserServiceError(`Failed to get user by email: ${error.message}`);
    }
  }

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/users/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000),
      });

      return {
        status: response.ok ? 'healthy' : 'unhealthy',
      };
    } catch (error) {
      return {
        status: 'unhealthy',
      };
    }
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

// Circuit breaker pattern (simple implementation)
export class CircuitBreakerUserClient {
  private failureCount = 0;
  private lastFailureTime = 0;
  private readonly threshold = 5;
  private readonly timeout = 60000; // 1 minute
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private userClient: UserServiceClient;

  constructor() {
    this.userClient = new UserServiceClient();
  }

  async getUser(userId: string): Promise<UserData> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new UserServiceError('Circuit breaker is OPEN - User service unavailable');
      }
    }

    try {
      const result = await this.userClient.getUser(userId);
      
      // Success - reset circuit breaker
      this.failureCount = 0;
      this.state = 'CLOSED';
      
      return result;
    } catch (error) {
      this.failureCount++;
      this.lastFailureTime = Date.now();
      
      if (this.failureCount >= this.threshold) {
        this.state = 'OPEN';
      }
      
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<UserData> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new UserServiceError('Circuit breaker is OPEN - User service unavailable');
      }
    }

    try {
      const result = await this.userClient.getUserByEmail(email);
      
      // Success - reset circuit breaker
      this.failureCount = 0;
      this.state = 'CLOSED';
      
      return result;
    } catch (error) {
      this.failureCount++;
      this.lastFailureTime = Date.now();
      
      if (this.failureCount >= this.threshold) {
        this.state = 'OPEN';
      }
      
      throw error;
    }
  }
}
