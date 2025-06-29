import React from 'react';
import { ExclamationTriangleIcon, XCircleIcon } from '@heroicons/react/24/outline';

export function InventoryAlerts() {
  const alerts = [
    {
      id: 1,
      product: 'Wireless Mouse',
      sku: 'WM-001',
      currentStock: 5,
      minStock: 10,
      status: 'low' as const,
    },
    {
      id: 2,
      product: 'USB Cable',
      sku: 'UC-002',
      currentStock: 0,
      minStock: 25,
      status: 'out' as const,
    },
    {
      id: 3,
      product: 'Phone Charger',
      sku: 'PC-003',
      currentStock: 3,
      minStock: 15,
      status: 'low' as const,
    },
    {
      id: 4,
      product: 'Bluetooth Speaker',
      sku: 'BS-004',
      currentStock: 8,
      minStock: 12,
      status: 'low' as const,
    },
    {
      id: 5,
      product: 'Screen Protector',
      sku: 'SP-005',
      currentStock: 0,
      minStock: 50,
      status: 'out' as const,
    },
  ];

  const getAlertIcon = (status: string) => {
    return status === 'out' ? XCircleIcon : ExclamationTriangleIcon;
  };

  const getAlertColor = (status: string) => {
    return status === 'out' 
      ? 'text-red-600 bg-red-50 border-red-200' 
      : 'text-yellow-600 bg-yellow-50 border-yellow-200';
  };

  return (
    <div className="space-y-3">
      {alerts.map((alert) => {
        const AlertIcon = getAlertIcon(alert.status);
        const colorClass = getAlertColor(alert.status);
        
        return (
          <div
            key={alert.id}
            className={`flex items-center justify-between p-3 rounded-lg border ${colorClass}`}
          >
            <div className="flex items-center space-x-3">
              <AlertIcon className="h-5 w-5" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {alert.product}
                </p>
                <p className="text-xs text-gray-500">SKU: {alert.sku}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">
                {alert.currentStock} / {alert.minStock}
              </p>
              <p className="text-xs text-gray-500">
                {alert.status === 'out' ? 'Out of stock' : 'Low stock'}
              </p>
            </div>
          </div>
        );
      })}

      {/* Action Buttons */}
      <div className="pt-2 border-t border-gray-200 space-y-2">
        <button className="w-full bg-blue-600 text-white text-sm font-medium py-2 px-4 rounded-lg hover:bg-blue-700">
          Reorder All Low Stock Items
        </button>
        <button className="w-full text-center text-sm text-blue-600 hover:text-blue-700 py-2">
          View Full Inventory Report
        </button>
      </div>
    </div>
  );
}
