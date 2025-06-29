// User Service - Independent API Controller (NO SHARED CODE)
import { Controller, Get, Post, Put, Delete, Param, Body, HttpStatus, HttpException } from '@nestjs/common';
import { UserService } from '../services/user.service';

// Own response types (NOT shared)
export interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  isEmailVerified: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

@Controller('api/v1/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':id')
  async getUser(@Param('id') id: string): Promise<UserResponse> {
    try {
      const user = await this.userService.findById(id);
      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        isEmailVerified: user.isEmailVerified,
        status: user.status,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('by-email/:email')
  async getUserByEmail(@Param('email') email: string): Promise<UserResponse> {
    try {
      const user = await this.userService.findByEmail(email);
      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        isEmailVerified: user.isEmailVerified,
        status: user.status,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post()
  async createUser(@Body() createUserRequest: CreateUserRequest): Promise<UserResponse> {
    try {
      const user = await this.userService.create(createUserRequest);
      
      // Publish event to Kafka (own event structure)
      await this.publishUserCreatedEvent(user);

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        isEmailVerified: user.isEmailVerified,
        status: user.status,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      };
    } catch (error) {
      throw new HttpException('Failed to create user', HttpStatus.BAD_REQUEST);
    }
  }

  @Put(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserRequest: UpdateUserRequest
  ): Promise<UserResponse> {
    try {
      const user = await this.userService.update(id, updateUserRequest);
      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      // Publish event to Kafka (own event structure)
      await this.publishUserUpdatedEvent(user);

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        isEmailVerified: user.isEmailVerified,
        status: user.status,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Failed to update user', HttpStatus.BAD_REQUEST);
    }
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string): Promise<{ message: string }> {
    try {
      const deleted = await this.userService.delete(id);
      if (!deleted) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      // Publish event to Kafka (own event structure)
      await this.publishUserDeletedEvent(id);

      return { message: 'User deleted successfully' };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Failed to delete user', HttpStatus.BAD_REQUEST);
    }
  }

  // Health check endpoint
  @Get('health')
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    };
  }

  // Private methods for event publishing (own event schemas)
  private async publishUserCreatedEvent(user: any): Promise<void> {
    const event = {
      eventType: 'user.created',
      eventId: this.generateEventId(),
      timestamp: new Date().toISOString(),
      data: {
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };

    // Publish to Kafka (implementation would be here)
    console.log('Publishing user.created event:', event);
  }

  private async publishUserUpdatedEvent(user: any): Promise<void> {
    const event = {
      eventType: 'user.updated',
      eventId: this.generateEventId(),
      timestamp: new Date().toISOString(),
      data: {
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };

    // Publish to Kafka (implementation would be here)
    console.log('Publishing user.updated event:', event);
  }

  private async publishUserDeletedEvent(userId: string): Promise<void> {
    const event = {
      eventType: 'user.deleted',
      eventId: this.generateEventId(),
      timestamp: new Date().toISOString(),
      data: {
        userId: userId,
      },
    };

    // Publish to Kafka (implementation would be here)
    console.log('Publishing user.deleted event:', event);
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
