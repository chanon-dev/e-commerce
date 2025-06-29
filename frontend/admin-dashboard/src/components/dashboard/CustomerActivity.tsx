import React from 'react';
import { UserIcon, ShoppingBagIcon, EyeIcon } from '@heroicons/react/24/outline';

export function CustomerActivity() {
  const activities = [
    {
      id: 1,
      type: 'registration' as const,
      customer: 'Alice Cooper',
      action: 'New customer registered',
      time: '5 min ago',
      icon: UserIcon,
    },
    {
      id: 2,
      type: 'purchase' as const,
      customer: 'Bob Johnson',
      action: 'Completed purchase of $89.99',
      time: '12 min ago',
      icon: ShoppingBagIcon,
    },
    {
      id: 3,
      type: 'view' as const,
      customer: 'Carol Smith',
      action: 'Viewed product: Wireless Headphones',
      time: '18 min ago',
      icon: EyeIcon,
    },
    {
      id: 4,
      type: 'registration' as const,
      customer: 'David Lee',
      action: 'New customer registered',
      time: '25 min ago',
      icon: UserIcon,
    },
    {
      id: 5,
      type: 'purchase' as const,
      customer: 'Eva Martinez',
      action: 'Completed purchase of $156.50',
      time: '32 min ago',
      icon: ShoppingBagIcon,
    },
  ];

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'registration':
        return 'bg-green-100 text-green-600';
      case 'purchase':
        return 'bg-blue-100 text-blue-600';
      case 'view':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start space-x-3">
          <div className={`p-2 rounded-lg ${getActivityColor(activity.type)}`}>
            <activity.icon className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">
              {activity.customer}
            </p>
            <p className="text-sm text-gray-600">{activity.action}</p>
            <p className="text-xs text-gray-400">{activity.time}</p>
          </div>
        </div>
      ))}

      {/* View More */}
      <div className="pt-2 border-t border-gray-200">
        <button className="w-full text-center text-sm text-blue-600 hover:text-blue-700 py-2">
          View All Activity
        </button>
      </div>
    </div>
  );
}
