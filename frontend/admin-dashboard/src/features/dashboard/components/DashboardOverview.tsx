'use client';

import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  ShoppingBagIcon,
  UsersIcon,
  CurrencyDollarIcon,
  TrendingUpIcon,
  TrendingDownIcon,
} from '@heroicons/react/24/outline';
import { adminApi } from '@/lib/api-client';

interface DashboardStats {
  salesSummary: {
    totalSales: number;
    salesGrowth: number;
    totalOrders: number;
    ordersGrowth: number;
  };
  customerMetrics: {
    totalCustomers: number;
    newCustomers: number;
    customerGrowth: number;
    activeCustomers: number;
  };
  revenueAnalytics: {
    totalRevenue: number;
    revenueGrowth: number;
    averageOrderValue: number;
    conversionRate: number;
  };
}

export function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  useEffect(() => {
    loadDashboardStats();
  }, [selectedPeriod]);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getDashboardStats();
      
      if (response.success) {
        setStats(response.data);
      } else {
        throw new Error('Failed to load dashboard stats');
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Dashboard stats error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="text-red-800 font-medium">Error loading dashboard</div>
        <div className="text-red-600 text-sm mt-1">{error}</div>
        <button
          onClick={loadDashboardStats}
          className="mt-3 bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const StatCard = ({ 
    title, 
    value, 
    growth, 
    icon: Icon, 
    color = 'blue' 
  }: {
    title: string;
    value: string | number;
    growth?: number;
    icon: any;
    color?: 'blue' | 'green' | 'purple' | 'orange';
  }) => {
    const colorClasses = {
      blue: 'bg-blue-50 text-blue-600',
      green: 'bg-green-50 text-green-600',
      purple: 'bg-purple-50 text-purple-600',
      orange: 'bg-orange-50 text-orange-600',
    };

    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between">
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
          {growth !== undefined && (
            <div className={`flex items-center space-x-1 ${
              growth >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {growth >= 0 ? (
                <TrendingUpIcon className="h-4 w-4" />
              ) : (
                <TrendingDownIcon className="h-4 w-4" />
              )}
              <span className="text-sm font-medium">
                {Math.abs(growth)}%
              </span>
            </div>
          )}
        </div>
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <div className="flex items-center space-x-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>
      </div>

      {/* Sales Summary */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Sales Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Sales"
            value={`$${stats?.salesSummary.totalSales?.toLocaleString() || '0'}`}
            growth={stats?.salesSummary.salesGrowth}
            icon={CurrencyDollarIcon}
            color="green"
          />
          <StatCard
            title="Total Orders"
            value={stats?.salesSummary.totalOrders || 0}
            growth={stats?.salesSummary.ordersGrowth}
            icon={ShoppingBagIcon}
            color="blue"
          />
          <StatCard
            title="Average Order Value"
            value={`$${stats?.revenueAnalytics.averageOrderValue?.toFixed(2) || '0.00'}`}
            icon={ChartBarIcon}
            color="purple"
          />
          <StatCard
            title="Conversion Rate"
            value={`${stats?.revenueAnalytics.conversionRate?.toFixed(2) || '0.00'}%`}
            icon={TrendingUpIcon}
            color="orange"
          />
        </div>
      </div>

      {/* Customer Metrics */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Customers"
            value={stats?.customerMetrics.totalCustomers || 0}
            growth={stats?.customerMetrics.customerGrowth}
            icon={UsersIcon}
            color="blue"
          />
          <StatCard
            title="New Customers"
            value={stats?.customerMetrics.newCustomers || 0}
            icon={UsersIcon}
            color="green"
          />
          <StatCard
            title="Active Customers"
            value={stats?.customerMetrics.activeCustomers || 0}
            icon={UsersIcon}
            color="purple"
          />
          <StatCard
            title="Customer Retention"
            value="85.2%"
            icon={TrendingUpIcon}
            color="orange"
          />
        </div>
      </div>

      {/* Revenue Analytics */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Revenue"
            value={`$${stats?.revenueAnalytics.totalRevenue?.toLocaleString() || '0'}`}
            growth={stats?.revenueAnalytics.revenueGrowth}
            icon={CurrencyDollarIcon}
            color="green"
          />
          <StatCard
            title="Monthly Recurring Revenue"
            value="$45,230"
            growth={12.5}
            icon={TrendingUpIcon}
            color="blue"
          />
          <StatCard
            title="Gross Profit Margin"
            value="42.8%"
            growth={2.1}
            icon={ChartBarIcon}
            color="purple"
          />
          <StatCard
            title="Customer Lifetime Value"
            value="$1,250"
            growth={8.3}
            icon={UsersIcon}
            color="orange"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <ShoppingBagIcon className="h-8 w-8 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">View Orders</span>
          </button>
          <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <UsersIcon className="h-8 w-8 text-green-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Manage Customers</span>
          </button>
          <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <ChartBarIcon className="h-8 w-8 text-purple-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">View Reports</span>
          </button>
          <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <CurrencyDollarIcon className="h-8 w-8 text-orange-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Revenue Analysis</span>
          </button>
        </div>
      </div>
    </div>
  );
}
