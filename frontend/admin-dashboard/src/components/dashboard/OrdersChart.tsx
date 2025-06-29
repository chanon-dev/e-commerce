'use client';

import React from 'react';

export function OrdersChart() {
  // Mock data for orders trend
  const ordersData = [
    { week: 'Week 1', orders: 45, completed: 42, pending: 3 },
    { week: 'Week 2', orders: 52, completed: 48, pending: 4 },
    { week: 'Week 3', orders: 38, completed: 35, pending: 3 },
    { week: 'Week 4', orders: 61, completed: 56, pending: 5 },
  ];

  const maxOrders = Math.max(...ordersData.map(d => d.orders));

  return (
    <div className="space-y-4">
      {/* Chart Area */}
      <div className="h-64 flex items-end justify-between space-x-4">
        {ordersData.map((data, index) => {
          const completedHeight = (data.completed / maxOrders) * 100;
          const pendingHeight = (data.pending / maxOrders) * 100;
          
          return (
            <div key={data.week} className="flex-1 flex flex-col items-center">
              <div className="w-full flex flex-col items-center">
                <div className="w-full flex flex-col">
                  {/* Pending Orders (top) */}
                  <div
                    className="w-full bg-yellow-400 transition-all duration-300 hover:bg-yellow-500 cursor-pointer relative group"
                    style={{ height: `${pendingHeight * 2}px` }}
                  >
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      Pending: {data.pending}
                    </div>
                  </div>
                  
                  {/* Completed Orders (bottom) */}
                  <div
                    className="w-full bg-green-500 transition-all duration-300 hover:bg-green-600 cursor-pointer relative group"
                    style={{ height: `${completedHeight * 2}px` }}
                  >
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      Completed: {data.completed}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-gray-500 mt-2">{data.week}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center space-x-6">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span className="text-sm text-gray-600">Completed</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-yellow-400 rounded"></div>
          <span className="text-sm text-gray-600">Pending</span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <p className="text-sm text-gray-500">Total Orders</p>
          <p className="text-lg font-semibold text-gray-900">
            {ordersData.reduce((sum, d) => sum + d.orders, 0)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500">Completion Rate</p>
          <p className="text-lg font-semibold text-green-600">
            {Math.round(
              (ordersData.reduce((sum, d) => sum + d.completed, 0) /
                ordersData.reduce((sum, d) => sum + d.orders, 0)) * 100
            )}%
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-lg font-semibold text-yellow-600">
            {ordersData.reduce((sum, d) => sum + d.pending, 0)}
          </p>
        </div>
      </div>
    </div>
  );
}
