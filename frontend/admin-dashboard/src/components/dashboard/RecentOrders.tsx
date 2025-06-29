import React from 'react';

export function RecentOrders() {
  const orders = [
    {
      id: '#ORD-001',
      customer: 'John Smith',
      amount: '$129.99',
      status: 'completed' as const,
      time: '2 min ago',
    },
    {
      id: '#ORD-002',
      customer: 'Sarah Johnson',
      amount: '$89.50',
      status: 'processing' as const,
      time: '5 min ago',
    },
    {
      id: '#ORD-003',
      customer: 'Mike Davis',
      amount: '$249.99',
      status: 'pending' as const,
      time: '12 min ago',
    },
    {
      id: '#ORD-004',
      customer: 'Emily Brown',
      amount: '$67.25',
      status: 'completed' as const,
      time: '18 min ago',
    },
    {
      id: '#ORD-005',
      customer: 'David Wilson',
      amount: '$156.80',
      status: 'cancelled' as const,
      time: '25 min ago',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <div key={order.id} className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium text-gray-900">{order.id}</p>
              <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                  order.status
                )}`}
              >
                {order.status}
              </span>
            </div>
            <p className="text-sm text-gray-500">{order.customer}</p>
            <p className="text-xs text-gray-400">{order.time}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{order.amount}</p>
          </div>
        </div>
      ))}

      {/* View More */}
      <div className="pt-2 border-t border-gray-200">
        <button className="w-full text-center text-sm text-blue-600 hover:text-blue-700 py-2">
          View All Orders
        </button>
      </div>
    </div>
  );
}
