'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  KeyIcon,
  UserGroupIcon,
  DocumentTextIcon,
  BellIcon,
  EyeIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
import { adminApi } from '@/lib/api-client';

interface SecurityData {
  vault_status: {
    status: 'sealed' | 'unsealed' | 'error';
    version: string;
    cluster_name: string;
    sealed_keys: number;
    unseal_threshold: number;
  };
  keycloak_status: {
    status: 'online' | 'offline' | 'degraded';
    version: string;
    realm_count: number;
    user_count: number;
    active_sessions: number;
  };
  security_alerts: Array<{
    id: string;
    type: 'authentication' | 'authorization' | 'suspicious_activity' | 'system';
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    timestamp: string;
    resolved: boolean;
  }>;
  access_logs: Array<{
    id: string;
    user_id: string;
    username: string;
    action: string;
    resource: string;
    ip_address: string;
    user_agent: string;
    timestamp: string;
    success: boolean;
  }>;
  failed_logins: Array<{
    username: string;
    ip_address: string;
    attempts: number;
    last_attempt: string;
  }>;
}

export function SecurityDashboard() {
  const [securityData, setSecurityData] = useState<SecurityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    try {
      setLoading(true);
      // Since we don't have specific security endpoints, we'll simulate the data
      // In a real implementation, these would be separate API calls
      const [vaultStatus, keycloakStatus, alerts, auditLogs] = await Promise.allSettled([
        adminApi.get('/security/vault/status'),
        adminApi.get('/security/keycloak/status'),
        adminApi.get('/security/alerts'),
        adminApi.get('/security/audit-logs'),
      ]);

      // Mock data for demonstration
      const mockData: SecurityData = {
        vault_status: {
          status: 'unsealed',
          version: '1.15.2',
          cluster_name: 'ecommerce-vault',
          sealed_keys: 3,
          unseal_threshold: 2,
        },
        keycloak_status: {
          status: 'online',
          version: '22.0.5',
          realm_count: 2,
          user_count: 1247,
          active_sessions: 89,
        },
        security_alerts: [
          {
            id: '1',
            type: 'authentication',
            severity: 'high',
            title: 'Multiple Failed Login Attempts',
            description: 'User admin@example.com has 5 failed login attempts from IP 192.168.1.100',
            timestamp: new Date(Date.now() - 300000).toISOString(),
            resolved: false,
          },
          {
            id: '2',
            type: 'suspicious_activity',
            severity: 'medium',
            title: 'Unusual Access Pattern',
            description: 'User accessing admin panel from new location: New York, US',
            timestamp: new Date(Date.now() - 600000).toISOString(),
            resolved: false,
          },
          {
            id: '3',
            type: 'system',
            severity: 'low',
            title: 'SSL Certificate Expiring',
            description: 'SSL certificate for api.example.com expires in 30 days',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            resolved: true,
          },
        ],
        access_logs: [
          {
            id: '1',
            user_id: 'user-123',
            username: 'admin@example.com',
            action: 'LOGIN',
            resource: '/admin/dashboard',
            ip_address: '192.168.1.50',
            user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            timestamp: new Date(Date.now() - 120000).toISOString(),
            success: true,
          },
          {
            id: '2',
            user_id: 'user-456',
            username: 'manager@example.com',
            action: 'UPDATE_PRODUCT',
            resource: '/admin/products/123',
            ip_address: '192.168.1.75',
            user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            timestamp: new Date(Date.now() - 180000).toISOString(),
            success: true,
          },
        ],
        failed_logins: [
          {
            username: 'admin@example.com',
            ip_address: '192.168.1.100',
            attempts: 5,
            last_attempt: new Date(Date.now() - 300000).toISOString(),
          },
          {
            username: 'test@example.com',
            ip_address: '10.0.0.50',
            attempts: 3,
            last_attempt: new Date(Date.now() - 900000).toISOString(),
          },
        ],
      };

      setSecurityData(mockData);
    } catch (err: any) {
      setError(err.message);
      console.error('Security data loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
      case 'unsealed':
        return 'text-green-600 bg-green-100';
      case 'degraded':
      case 'sealed':
        return 'text-yellow-600 bg-yellow-100';
      case 'offline':
      case 'error':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="text-red-800 font-medium">Error loading security dashboard</div>
        <div className="text-red-600 text-sm mt-1">{error}</div>
        <button
          onClick={loadSecurityData}
          className="mt-3 bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Security Dashboard</h1>
          <p className="text-gray-600">Monitor security status and manage access controls</p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            href="/admin/security/audit"
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <DocumentTextIcon className="h-4 w-4" />
            <span>Audit Logs</span>
          </Link>
          <Link
            href="/admin/security/alerts"
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            <BellIcon className="h-4 w-4" />
            <span>Security Alerts</span>
          </Link>
        </div>
      </div>

      {/* Security Services Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* HashiCorp Vault */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`p-3 rounded-lg ${getStatusColor(securityData?.vault_status.status || 'error')}`}>
                <KeyIcon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">HashiCorp Vault</h3>
                <p className="text-sm text-gray-500">Secrets Management</p>
              </div>
            </div>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(securityData?.vault_status.status || 'error')}`}>
              {securityData?.vault_status.status?.charAt(0).toUpperCase() + securityData?.vault_status.status?.slice(1)}
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Version:</span>
              <span className="text-gray-900">{securityData?.vault_status.version}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Cluster:</span>
              <span className="text-gray-900">{securityData?.vault_status.cluster_name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Unseal Keys:</span>
              <span className="text-gray-900">
                {securityData?.vault_status.sealed_keys} / {securityData?.vault_status.unseal_threshold}
              </span>
            </div>
          </div>
        </div>

        {/* Keycloak */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`p-3 rounded-lg ${getStatusColor(securityData?.keycloak_status.status || 'offline')}`}>
                <UserGroupIcon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Keycloak</h3>
                <p className="text-sm text-gray-500">Identity Management</p>
              </div>
            </div>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(securityData?.keycloak_status.status || 'offline')}`}>
              {securityData?.keycloak_status.status?.charAt(0).toUpperCase() + securityData?.keycloak_status.status?.slice(1)}
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Version:</span>
              <span className="text-gray-900">{securityData?.keycloak_status.version}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Realms:</span>
              <span className="text-gray-900">{securityData?.keycloak_status.realm_count}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Users:</span>
              <span className="text-gray-900">{securityData?.keycloak_status.user_count?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Active Sessions:</span>
              <span className="text-gray-900">{securityData?.keycloak_status.active_sessions}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Security Alerts */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Security Alerts</h2>
            <Link
              href="/admin/security/alerts"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View All
            </Link>
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {securityData?.security_alerts?.slice(0, 5).map((alert) => (
            <div key={alert.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${getSeverityColor(alert.severity)}`}>
                    <ExclamationTriangleIcon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-medium text-gray-900">{alert.title}</h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                        {alert.severity.toUpperCase()}
                      </span>
                      {alert.resolved && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          RESOLVED
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(alert.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                <button className="text-blue-600 hover:text-blue-900">
                  <EyeIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Access Logs */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Access Logs</h2>
            <Link
              href="/admin/security/audit"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View All Logs
            </Link>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Resource
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {securityData?.access_logs?.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{log.username}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{log.action}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{log.resource}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{log.ip_address}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      log.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {log.success ? 'Success' : 'Failed'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Failed Login Attempts */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Failed Login Attempts</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Username
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Attempts
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Attempt
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {securityData?.failed_logins?.map((login, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{login.username}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{login.ip_address}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      login.attempts >= 5 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {login.attempts} attempts
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {new Date(login.last_attempt).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button className="text-red-600 hover:text-red-900">
                      <LockClosedIcon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
