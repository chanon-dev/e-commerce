import * as vault from 'node-vault';

export interface VaultConfig {
  endpoint: string;
  token?: string;
  roleId?: string;
  secretId?: string;
  namespace?: string;
  apiVersion: string;
  requestTimeout: number;
  maxRetries: number;
}

export interface SecretPath {
  path: string;
  mount: string;
  version?: number;
}

export class VaultConfigManager {
  private static instance: VaultConfigManager;
  private vaultClient: any;
  private config: VaultConfig;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): VaultConfigManager {
    if (!VaultConfigManager.instance) {
      VaultConfigManager.instance = new VaultConfigManager();
    }
    return VaultConfigManager.instance;
  }

  // Environment-specific configurations
  getVaultConfig(environment: string = process.env.NODE_ENV || 'development'): VaultConfig {
    const baseConfig: VaultConfig = {
      endpoint: process.env.VAULT_ADDR || 'http://localhost:8200',
      apiVersion: 'v1',
      requestTimeout: 5000,
      maxRetries: 3,
    };

    switch (environment) {
      case 'production':
        return {
          ...baseConfig,
          endpoint: process.env.VAULT_ADDR || 'https://vault.company.com',
          namespace: process.env.VAULT_NAMESPACE || 'ecommerce',
          roleId: process.env.VAULT_ROLE_ID,
          secretId: process.env.VAULT_SECRET_ID,
          requestTimeout: 10000,
          maxRetries: 5,
        };

      case 'staging':
        return {
          ...baseConfig,
          endpoint: process.env.VAULT_ADDR || 'https://vault-staging.company.com',
          namespace: process.env.VAULT_NAMESPACE || 'ecommerce-staging',
          roleId: process.env.VAULT_ROLE_ID,
          secretId: process.env.VAULT_SECRET_ID,
          requestTimeout: 8000,
          maxRetries: 3,
        };

      case 'development':
      default:
        return {
          ...baseConfig,
          token: process.env.VAULT_DEV_ROOT_TOKEN_ID || 'dev-only-token',
          requestTimeout: 3000,
          maxRetries: 2,
        };
    }
  }

  async initialize(environment?: string): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    this.config = this.getVaultConfig(environment);
    
    try {
      // Initialize Vault client
      this.vaultClient = vault({
        apiVersion: this.config.apiVersion,
        endpoint: this.config.endpoint,
        token: this.config.token,
        namespace: this.config.namespace,
        requestTimeout: this.config.requestTimeout,
      });

      // Authenticate based on environment
      if (this.config.roleId && this.config.secretId) {
        await this.authenticateWithAppRole();
      } else if (this.config.token) {
        await this.authenticateWithToken();
      } else {
        throw new Error('No authentication method configured for Vault');
      }

      this.isInitialized = true;
      console.log(`✅ Vault initialized for ${environment || 'development'} environment`);
    } catch (error) {
      console.error('❌ Failed to initialize Vault:', error);
      throw error;
    }
  }

  private async authenticateWithAppRole(): Promise<void> {
    try {
      const result = await this.vaultClient.approleLogin({
        role_id: this.config.roleId,
        secret_id: this.config.secretId,
      });

      this.vaultClient.token = result.auth.client_token;
      console.log('🔐 Authenticated with Vault using AppRole');
    } catch (error) {
      console.error('❌ AppRole authentication failed:', error);
      throw error;
    }
  }

  private async authenticateWithToken(): Promise<void> {
    try {
      // Verify token is valid
      await this.vaultClient.tokenLookupSelf();
      console.log('🔐 Authenticated with Vault using token');
    } catch (error) {
      console.error('❌ Token authentication failed:', error);
      throw error;
    }
  }

  async getSecret(path: string, mount: string = 'secret'): Promise<any> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const secretPath = `${mount}/data/${path}`;
      const result = await this.vaultClient.read(secretPath);
      
      if (result?.data?.data) {
        return result.data.data;
      } else {
        throw new Error(`Secret not found at path: ${secretPath}`);
      }
    } catch (error) {
      console.error(`❌ Failed to read secret from ${path}:`, error);
      throw error;
    }
  }

  async setSecret(path: string, secrets: Record<string, any>, mount: string = 'secret'): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const secretPath = `${mount}/data/${path}`;
      await this.vaultClient.write(secretPath, {
        data: secrets,
      });
      
      console.log(`✅ Secret written to ${secretPath}`);
    } catch (error) {
      console.error(`❌ Failed to write secret to ${path}:`, error);
      throw error;
    }
  }

  async deleteSecret(path: string, mount: string = 'secret'): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const secretPath = `${mount}/data/${path}`;
      await this.vaultClient.delete(secretPath);
      
      console.log(`🗑️ Secret deleted from ${secretPath}`);
    } catch (error) {
      console.error(`❌ Failed to delete secret from ${path}:`, error);
      throw error;
    }
  }

  async listSecrets(path: string = '', mount: string = 'secret'): Promise<string[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const secretPath = `${mount}/metadata/${path}`;
      const result = await this.vaultClient.list(secretPath);
      
      return result?.data?.keys || [];
    } catch (error) {
      console.error(`❌ Failed to list secrets from ${path}:`, error);
      return [];
    }
  }

  // Health check
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    initialized: boolean;
    sealed: boolean;
    version: string;
  }> {
    try {
      const health = await this.vaultClient.health();
      const status = await this.vaultClient.status();
      
      return {
        status: health.sealed ? 'unhealthy' : 'healthy',
        initialized: health.initialized,
        sealed: health.sealed,
        version: health.version,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        initialized: false,
        sealed: true,
        version: 'unknown',
      };
    }
  }

  // Utility methods
  isHealthy(): boolean {
    return this.isInitialized;
  }

  getClient(): any {
    if (!this.isInitialized) {
      throw new Error('Vault client not initialized');
    }
    return this.vaultClient;
  }
}
