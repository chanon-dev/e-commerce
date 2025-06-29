// Keycloak Client for Node.js services
const axios = require('axios');
const jwt = require('jsonwebtoken');

class KeycloakClient {
  constructor(options = {}) {
    this.keycloakUrl = options.keycloakUrl || process.env.KEYCLOAK_URL || 'http://localhost:8080';
    this.realm = options.realm || process.env.KEYCLOAK_REALM || 'ecommerce';
    this.clientId = options.clientId || process.env.KEYCLOAK_CLIENT_ID;
    this.clientSecret = options.clientSecret || process.env.KEYCLOAK_CLIENT_SECRET;
    this.adminUsername = options.adminUsername || process.env.KEYCLOAK_ADMIN_USERNAME;
    this.adminPassword = options.adminPassword || process.env.KEYCLOAK_ADMIN_PASSWORD;
    
    this.adminToken = null;
    this.adminTokenExpiry = null;
    this.publicKey = null;
  }

  // Get realm URL
  getRealmUrl() {
    return `${this.keycloakUrl}/realms/${this.realm}`;
  }

  // Get admin URL
  getAdminUrl() {
    return `${this.keycloakUrl}/admin/realms/${this.realm}`;
  }

  // Authenticate user with username/password
  async authenticateUser(username, password) {
    try {
      const response = await axios.post(`${this.getRealmUrl()}/protocol/openid-connect/token`, 
        new URLSearchParams({
          grant_type: 'password',
          client_id: this.clientId,
          client_secret: this.clientSecret,
          username: username,
          password: password,
          scope: 'openid profile email'
        }), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      return {
        success: true,
        tokens: response.data,
        user: this.decodeToken(response.data.access_token)
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error_description || error.message
      };
    }
  }

  // Refresh access token
  async refreshToken(refreshToken) {
    try {
      const response = await axios.post(`${this.getRealmUrl()}/protocol/openid-connect/token`, 
        new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: this.clientId,
          client_secret: this.clientSecret,
          refresh_token: refreshToken
        }), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      return {
        success: true,
        tokens: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error_description || error.message
      };
    }
  }

  // Logout user
  async logoutUser(refreshToken) {
    try {
      await axios.post(`${this.getRealmUrl()}/protocol/openid-connect/logout`, 
        new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          refresh_token: refreshToken
        }), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error_description || error.message
      };
    }
  }

  // Get user info from token
  async getUserInfo(accessToken) {
    try {
      const response = await axios.get(`${this.getRealmUrl()}/protocol/openid-connect/userinfo`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      return {
        success: true,
        user: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error_description || error.message
      };
    }
  }

  // Verify and decode JWT token
  async verifyToken(token) {
    try {
      if (!this.publicKey) {
        await this.getPublicKey();
      }

      const decoded = jwt.verify(token, this.publicKey, {
        algorithms: ['RS256'],
        issuer: this.getRealmUrl()
      });

      return {
        valid: true,
        decoded: decoded
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }

  // Decode token without verification (for development)
  decodeToken(token) {
    try {
      return jwt.decode(token);
    } catch (error) {
      return null;
    }
  }

  // Get public key for token verification
  async getPublicKey() {
    try {
      const response = await axios.get(`${this.getRealmUrl()}/protocol/openid-connect/certs`);
      const key = response.data.keys[0];
      
      // Convert JWK to PEM format
      this.publicKey = this.jwkToPem(key);
      return this.publicKey;
    } catch (error) {
      throw new Error(`Failed to get public key: ${error.message}`);
    }
  }

  // Convert JWK to PEM format
  jwkToPem(jwk) {
    const { n, e } = jwk;
    const modulus = Buffer.from(n, 'base64');
    const exponent = Buffer.from(e, 'base64');
    
    // This is a simplified conversion - in production, use a proper library like node-jose
    return `-----BEGIN PUBLIC KEY-----\n${Buffer.concat([modulus, exponent]).toString('base64')}\n-----END PUBLIC KEY-----`;
  }

  // Admin API methods
  async getAdminToken() {
    try {
      if (this.adminToken && this.adminTokenExpiry && Date.now() < this.adminTokenExpiry) {
        return this.adminToken;
      }

      const response = await axios.post(`${this.keycloakUrl}/realms/master/protocol/openid-connect/token`, 
        new URLSearchParams({
          grant_type: 'password',
          client_id: 'admin-cli',
          username: this.adminUsername,
          password: this.adminPassword
        }), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      this.adminToken = response.data.access_token;
      this.adminTokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000; // Refresh 1 minute early

      return this.adminToken;
    } catch (error) {
      throw new Error(`Failed to get admin token: ${error.message}`);
    }
  }

  // Create user
  async createUser(userData) {
    try {
      const token = await this.getAdminToken();
      
      const response = await axios.post(`${this.getAdminUrl()}/users`, userData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        userId: response.headers.location?.split('/').pop()
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.errorMessage || error.message
      };
    }
  }

  // Get user by ID
  async getUser(userId) {
    try {
      const token = await this.getAdminToken();
      
      const response = await axios.get(`${this.getAdminUrl()}/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return {
        success: true,
        user: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.errorMessage || error.message
      };
    }
  }

  // Update user
  async updateUser(userId, userData) {
    try {
      const token = await this.getAdminToken();
      
      await axios.put(`${this.getAdminUrl()}/users/${userId}`, userData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.errorMessage || error.message
      };
    }
  }

  // Delete user
  async deleteUser(userId) {
    try {
      const token = await this.getAdminToken();
      
      await axios.delete(`${this.getAdminUrl()}/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.errorMessage || error.message
      };
    }
  }

  // Search users
  async searchUsers(query, options = {}) {
    try {
      const token = await this.getAdminToken();
      
      const params = new URLSearchParams({
        search: query,
        first: options.first || 0,
        max: options.max || 20
      });

      const response = await axios.get(`${this.getAdminUrl()}/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return {
        success: true,
        users: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.errorMessage || error.message
      };
    }
  }

  // Assign role to user
  async assignRoleToUser(userId, roleName) {
    try {
      const token = await this.getAdminToken();
      
      // Get role
      const roleResponse = await axios.get(`${this.getAdminUrl()}/roles/${roleName}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const role = roleResponse.data;

      // Assign role to user
      await axios.post(`${this.getAdminUrl()}/users/${userId}/role-mappings/realm`, [role], {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.errorMessage || error.message
      };
    }
  }

  // Remove role from user
  async removeRoleFromUser(userId, roleName) {
    try {
      const token = await this.getAdminToken();
      
      // Get role
      const roleResponse = await axios.get(`${this.getAdminUrl()}/roles/${roleName}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const role = roleResponse.data;

      // Remove role from user
      await axios.delete(`${this.getAdminUrl()}/users/${userId}/role-mappings/realm`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: [role]
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.errorMessage || error.message
      };
    }
  }

  // Get user roles
  async getUserRoles(userId) {
    try {
      const token = await this.getAdminToken();
      
      const response = await axios.get(`${this.getAdminUrl()}/users/${userId}/role-mappings/realm`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return {
        success: true,
        roles: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.errorMessage || error.message
      };
    }
  }

  // Send verification email
  async sendVerificationEmail(userId) {
    try {
      const token = await this.getAdminToken();
      
      await axios.put(`${this.getAdminUrl()}/users/${userId}/send-verify-email`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.errorMessage || error.message
      };
    }
  }

  // Reset user password
  async resetUserPassword(userId, newPassword, temporary = false) {
    try {
      const token = await this.getAdminToken();
      
      await axios.put(`${this.getAdminUrl()}/users/${userId}/reset-password`, {
        type: 'password',
        value: newPassword,
        temporary: temporary
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.errorMessage || error.message
      };
    }
  }

  // Health check
  async healthCheck() {
    try {
      const response = await axios.get(`${this.keycloakUrl}/health/ready`);
      return {
        status: 'healthy',
        ready: response.status === 200
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
let keycloakInstance = null;

function createKeycloakClient(options = {}) {
  if (!keycloakInstance) {
    keycloakInstance = new KeycloakClient(options);
  }
  return keycloakInstance;
}

module.exports = {
  KeycloakClient,
  createKeycloakClient
};

// Usage example:
/*
const { createKeycloakClient } = require('./keycloak-client');

const keycloak = createKeycloakClient({
  keycloakUrl: 'http://localhost:8080',
  realm: 'ecommerce',
  clientId: 'ecommerce-api',
  clientSecret: 'your-client-secret'
});

// Authenticate user
const authResult = await keycloak.authenticateUser('username', 'password');

// Verify token
const verifyResult = await keycloak.verifyToken(accessToken);

// Get user info
const userInfo = await keycloak.getUserInfo(accessToken);
*/
