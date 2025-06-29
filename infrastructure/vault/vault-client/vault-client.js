// Vault Client for Node.js services
const axios = require('axios');

class VaultClient {
  constructor(options = {}) {
    this.vaultAddr = options.vaultAddr || process.env.VAULT_ADDR || 'http://localhost:8200';
    this.roleId = options.roleId || process.env.VAULT_ROLE_ID;
    this.secretId = options.secretId || process.env.VAULT_SECRET_ID;
    this.token = null;
    this.tokenExpiry = null;
    this.mountPath = options.mountPath || 'ecommerce';
  }

  async authenticate() {
    try {
      if (this.token && this.tokenExpiry && Date.now() < this.tokenExpiry) {
        return this.token;
      }

      const response = await axios.post(`${this.vaultAddr}/v1/auth/approle/login`, {
        role_id: this.roleId,
        secret_id: this.secretId
      });

      this.token = response.data.auth.client_token;
      this.tokenExpiry = Date.now() + (response.data.auth.lease_duration * 1000) - 60000; // Refresh 1 minute early

      return this.token;
    } catch (error) {
      throw new Error(`Vault authentication failed: ${error.message}`);
    }
  }

  async getSecret(path) {
    try {
      await this.authenticate();

      const response = await axios.get(`${this.vaultAddr}/v1/${this.mountPath}/data/${path}`, {
        headers: {
          'X-Vault-Token': this.token
        }
      });

      return response.data.data.data;
    } catch (error) {
      throw new Error(`Failed to get secret from ${path}: ${error.message}`);
    }
  }

  async putSecret(path, data) {
    try {
      await this.authenticate();

      await axios.post(`${this.vaultAddr}/v1/${this.mountPath}/data/${path}`, {
        data: data
      }, {
        headers: {
          'X-Vault-Token': this.token
        }
      });

      return true;
    } catch (error) {
      throw new Error(`Failed to put secret to ${path}: ${error.message}`);
    }
  }

  async deleteSecret(path) {
    try {
      await this.authenticate();

      await axios.delete(`${this.vaultAddr}/v1/${this.mountPath}/data/${path}`, {
        headers: {
          'X-Vault-Token': this.token
        }
      });

      return true;
    } catch (error) {
      throw new Error(`Failed to delete secret from ${path}: ${error.message}`);
    }
  }

  async getDatabaseCredentials(role) {
    try {
      await this.authenticate();

      const response = await axios.get(`${this.vaultAddr}/v1/database/creds/${role}`, {
        headers: {
          'X-Vault-Token': this.token
        }
      });

      return {
        username: response.data.data.username,
        password: response.data.data.password,
        lease_id: response.data.lease_id,
        lease_duration: response.data.lease_duration
      };
    } catch (error) {
      throw new Error(`Failed to get database credentials for role ${role}: ${error.message}`);
    }
  }

  async renewLease(leaseId) {
    try {
      await this.authenticate();

      const response = await axios.post(`${this.vaultAddr}/v1/sys/leases/renew`, {
        lease_id: leaseId
      }, {
        headers: {
          'X-Vault-Token': this.token
        }
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to renew lease ${leaseId}: ${error.message}`);
    }
  }

  async revokeLease(leaseId) {
    try {
      await this.authenticate();

      await axios.post(`${this.vaultAddr}/v1/sys/leases/revoke`, {
        lease_id: leaseId
      }, {
        headers: {
          'X-Vault-Token': this.token
        }
      });

      return true;
    } catch (error) {
      throw new Error(`Failed to revoke lease ${leaseId}: ${error.message}`);
    }
  }

  // Convenience methods for common secret paths
  async getJWTSecrets() {
    return await this.getSecret('jwt/signing-keys');
  }

  async getSharedSecrets() {
    return await this.getSecret('shared/database');
  }

  async getServiceConfig(serviceName) {
    return await this.getSecret(`${serviceName}/config`);
  }

  async getPaymentProviderSecrets(provider) {
    return await this.getSecret(`payment-providers/${provider}`);
  }

  async getOAuthSecrets() {
    return await this.getSecret('auth-service/oauth');
  }

  async getEmailConfig() {
    return await this.getSecret('auth-service/email');
  }

  async getAWSCredentials() {
    return await this.getSecret('product-service/aws');
  }

  async getShippingCarrierSecrets() {
    return await this.getSecret('shipping-service/carriers');
  }

  // Health check
  async healthCheck() {
    try {
      const response = await axios.get(`${this.vaultAddr}/v1/sys/health`);
      return {
        status: 'healthy',
        initialized: response.data.initialized,
        sealed: response.data.sealed,
        standby: response.data.standby
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }
}

// Singleton instance
let vaultInstance = null;

function createVaultClient(options = {}) {
  if (!vaultInstance) {
    vaultInstance = new VaultClient(options);
  }
  return vaultInstance;
}

module.exports = {
  VaultClient,
  createVaultClient
};

// Usage example:
/*
const { createVaultClient } = require('./vault-client');

const vault = createVaultClient({
  vaultAddr: 'http://localhost:8200',
  roleId: 'your-role-id',
  secretId: 'your-secret-id'
});

// Get secrets
const dbConfig = await vault.getSharedSecrets();
const jwtSecrets = await vault.getJWTSecrets();
const serviceConfig = await vault.getServiceConfig('auth-service');

// Get dynamic database credentials
const dbCreds = await vault.getDatabaseCredentials('auth-service-role');
*/
