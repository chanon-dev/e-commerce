import { motion } from 'framer-motion';
import {
  CurrencyDollarIcon,
  ShoppingBagIcon,
  UsersIcon,
  ChartBarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '@heroicons/react/24/outline';
import { formatPrice, formatNumber } from '@/utils/formatters';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';

interface DashboardStatsProps {
  data?: {
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    totalProducts: number;
    revenueGrowth: number;
    ordersGrowth: number;
    customersGrowth: number;
    productsGrowth: number;
  };
  isLoading?: boolean;
}

const DashboardStats = ({ data, isLoading }: DashboardStatsProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <LoadingSkeleton className="h-4 w-16 mb-2" />
            <LoadingSkeleton className="h-8 w-24 mb-2" />
            <LoadingSkeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (!data) return null;

  const stats = [
    {
      name: 'Total Revenue',
      value: formatPrice(data.totalRevenue),
      change: data.revenueGrowth,
      icon: CurrencyDollarIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      name: 'Total Orders',
      value: formatNumber(data.totalOrders),
      change: data.ordersGrowth,
      icon: ShoppingBagIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      name: 'Total Customers',
      value: formatNumber(data.totalCustomers),
      change: data.customersGrowth,
      icon: UsersIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      name: 'Total Products',
      value: formatNumber(data.totalProducts),
      change: data.productsGrowth,
      icon: ChartBarIcon,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.name}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200"
        >
          <div className="flex items-center">
            <div className={`flex-shrink-0 p-3 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-500">{stat.name}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
          
          {/* Growth indicator */}
          <div className="mt-4 flex items-center">
            {stat.change > 0 ? (
              <ArrowUpIcon className="w-4 h-4 text-green-500 mr-1" />
            ) : stat.change < 0 ? (
              <ArrowDownIcon className="w-4 h-4 text-red-500 mr-1" />
            ) : null}
            <span
              className={`text-sm font-medium ${
                stat.change > 0
                  ? 'text-green-600'
                  : stat.change < 0
                  ? 'text-red-600'
                  : 'text-gray-500'
              }`}
            >
              {stat.change > 0 ? '+' : ''}{stat.change.toFixed(1)}%
            </span>
            <span className="text-sm text-gray-500 ml-1">vs last month</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default DashboardStats;
