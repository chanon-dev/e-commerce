import React from 'react';
import { TrendingUpIcon, TrendingDownIcon } from '@heroicons/react/24/outline';

export function TopProducts() {
  const products = [
    {
      id: 1,
      name: 'Wireless Headphones',
      sales: 245,
      revenue: '$12,250',
      trend: 'up' as const,
      change: '+15%',
      image: '/api/placeholder/40/40',
    },
    {
      id: 2,
      name: 'Smart Watch',
      sales: 189,
      revenue: '$18,900',
      trend: 'up' as const,
      change: '+8%',
      image: '/api/placeholder/40/40',
    },
    {
      id: 3,
      name: 'Laptop Stand',
      sales: 156,
      revenue: '$4,680',
      trend: 'down' as const,
      change: '-3%',
      image: '/api/placeholder/40/40',
    },
    {
      id: 4,
      name: 'USB-C Cable',
      sales: 134,
      revenue: '$2,010',
      trend: 'up' as const,
      change: '+22%',
      image: '/api/placeholder/40/40',
    },
    {
      id: 5,
      name: 'Phone Case',
      sales: 98,
      revenue: '$2,940',
      trend: 'down' as const,
      change: '-5%',
      image: '/api/placeholder/40/40',
    },
  ];

  return (
    <div className="space-y-4">
      {products.map((product, index) => (
        <div key={product.id} className="flex items-center space-x-3">
          {/* Rank */}
          <div className="flex-shrink-0 w-6 text-center">
            <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
          </div>

          {/* Product Image */}
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-xs text-gray-500">IMG</span>
            </div>
          </div>

          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {product.name}
            </p>
            <p className="text-xs text-gray-500">
              {product.sales} sales • {product.revenue}
            </p>
          </div>

          {/* Trend */}
          <div className="flex-shrink-0">
            <div className={`flex items-center space-x-1 ${
              product.trend === 'up' ? 'text-green-600' : 'text-red-600'
            }`}>
              {product.trend === 'up' ? (
                <TrendingUpIcon className="h-4 w-4" />
              ) : (
                <TrendingDownIcon className="h-4 w-4" />
              )}
              <span className="text-xs font-medium">{product.change}</span>
            </div>
          </div>
        </div>
      ))}

      {/* View More */}
      <div className="pt-2 border-t border-gray-200">
        <button className="w-full text-center text-sm text-blue-600 hover:text-blue-700 py-2">
          View All Products
        </button>
      </div>
    </div>
  );
}
