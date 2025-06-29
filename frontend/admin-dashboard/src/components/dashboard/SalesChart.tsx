'use client';

import React from 'react';

export function SalesChart() {
  // Mock data for the chart - in a real app, this would come from an API
  const salesData = [
    { day: 'Mon', sales: 12000 },
    { day: 'Tue', sales: 15000 },
    { day: 'Wed', sales: 8000 },
    { day: 'Thu', sales: 18000 },
    { day: 'Fri', sales: 22000 },
    { day: 'Sat', sales: 25000 },
    { day: 'Sun', sales: 20000 },
  ];

  const maxSales = Math.max(...salesData.map(d => d.sales));

  return (
    <div className="space-y-4">
      {/* Chart Area */}
      <div className="h-64 flex items-end justify-between space-x-2">
        {salesData.map((data, index) => {
          const height = (data.sales / maxSales) * 100;
          return (
            <div key={data.day} className="flex-1 flex flex-col items-center">
              <div className="w-full flex flex-col items-center">
                <div
                  className="w-full bg-blue-500 rounded-t-sm transition-all duration-300 hover:bg-blue-600 cursor-pointer relative group"
                  style={{ height: `${height * 2}px` }}
                >
                  {/* Tooltip */}
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    ${data.sales.toLocaleString()}
                  </div>
                </div>
                <span className="text-xs text-gray-500 mt-2">{data.day}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <p className="text-sm text-gray-500">Total Sales</p>
          <p className="text-lg font-semibold text-gray-900">
            ${salesData.reduce((sum, d) => sum + d.sales, 0).toLocaleString()}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500">Average</p>
          <p className="text-lg font-semibold text-gray-900">
            ${Math.round(salesData.reduce((sum, d) => sum + d.sales, 0) / salesData.length).toLocaleString()}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500">Peak Day</p>
          <p className="text-lg font-semibold text-gray-900">
            ${maxSales.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
