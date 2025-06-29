import React from 'react';
import { 
  ClockIcon, 
  GlobeAltIcon, 
  ServerIcon, 
  CpuChipIcon 
} from '@heroicons/react/24/outline';

export function PerformanceMetrics() {
  const metrics = [
    {
      id: 1,
      name: 'Page Load Time',
      value: '1.2s',
      status: 'good' as const,
      icon: ClockIcon,
      description: 'Average response time',
    },
    {
      id: 2,
      name: 'API Response',
      value: '245ms',
      status: 'good' as const,
      icon: ServerIcon,
      description: 'Backend API latency',
    },
    {
      id: 3,
      name: 'Uptime',
      value: '99.9%',
      status: 'excellent' as const,
      icon: GlobeAltIcon,
      description: 'System availability',
    },
    {
      id: 4,
      name: 'CPU Usage',
      value: '68%',
      status: 'warning' as const,
      icon: CpuChipIcon,
      description: 'Server resource usage',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'text-green-600 bg-green-50';
      case 'good':
        return 'text-blue-600 bg-blue-50';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50';
      case 'critical':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'bg-green-400';
      case 'good':
        return 'bg-blue-400';
      case 'warning':
        return 'bg-yellow-400';
      case 'critical':
        return 'bg-red-400';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <div className="space-y-4">
      {metrics.map((metric) => (
        <div key={metric.id} className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${getStatusColor(metric.status)}`}>
              <metric.icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{metric.name}</p>
              <p className="text-xs text-gray-500">{metric.description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-900">
              {metric.value}
            </span>
            <div className={`w-2 h-2 rounded-full ${getStatusDot(metric.status)}`}></div>
          </div>
        </div>
      ))}

      {/* System Health Summary */}
      <div className="pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-900">System Health</span>
          <span className="text-sm text-green-600 font-medium">Healthy</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }}></div>
        </div>
        <p className="text-xs text-gray-500 mt-1">85% - All systems operational</p>
      </div>

      {/* Quick Actions */}
      <div className="pt-2 space-y-2">
        <button className="w-full text-center text-sm text-blue-600 hover:text-blue-700 py-2">
          View Detailed Metrics
        </button>
      </div>
    </div>
  );
}
