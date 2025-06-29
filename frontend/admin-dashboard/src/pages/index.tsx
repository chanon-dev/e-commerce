import { NextPage } from 'next';
import { NextSeo } from 'next-seo';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/Layout/AdminLayout';
import DashboardStats from '@/components/dashboard/DashboardStats';
import SalesChart from '@/components/dashboard/SalesChart';
import RecentOrders from '@/components/dashboard/RecentOrders';
import TopProducts from '@/components/dashboard/TopProducts';
import CustomerInsights from '@/components/dashboard/CustomerInsights';
import { useAuthStore } from '@/stores/authStore';
import { useDashboardData } from '@/hooks/useDashboardData';

const AdminDashboard: NextPage = () => {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const { data: dashboardData, isLoading: isDashboardLoading } = useDashboardData();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (user && !['admin', 'manager'].includes(user.role)) {
      router.push('/unauthorized');
    }
  }, [user, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <NextSeo
        title="Dashboard - E-commerce Admin"
        description="E-commerce admin dashboard for managing products, orders, customers, and analytics"
        noindex={true}
        nofollow={true}
      />
      
      <AdminLayout>
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">
                Welcome back, {user?.firstName}! Here's what's happening with your store.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                Export Report
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                View Analytics
              </button>
            </div>
          </div>

          {/* Dashboard Stats */}
          <DashboardStats 
            data={dashboardData?.stats} 
            isLoading={isDashboardLoading} 
          />

          {/* Charts and Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="lg:col-span-2">
              <SalesChart 
                data={dashboardData?.salesChart} 
                isLoading={isDashboardLoading} 
              />
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <RecentOrders 
                orders={dashboardData?.recentOrders} 
                isLoading={isDashboardLoading} 
              />
            </div>
            <div>
              <TopProducts 
                products={dashboardData?.topProducts} 
                isLoading={isDashboardLoading} 
              />
            </div>
          </div>

          {/* Customer Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CustomerInsights 
              data={dashboardData?.customerInsights} 
              isLoading={isDashboardLoading} 
            />
            
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/products/new')}
                  className="w-full text-left px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-white text-sm">+</span>
                    </div>
                    <div>
                      <div className="font-medium">Add New Product</div>
                      <div className="text-sm text-blue-600">Create a new product listing</div>
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => router.push('/orders')}
                  className="w-full text-left px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-white text-sm">📦</span>
                    </div>
                    <div>
                      <div className="font-medium">Manage Orders</div>
                      <div className="text-sm text-green-600">Process pending orders</div>
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => router.push('/customers')}
                  className="w-full text-left px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-white text-sm">👥</span>
                    </div>
                    <div>
                      <div className="font-medium">View Customers</div>
                      <div className="text-sm text-purple-600">Manage customer accounts</div>
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => router.push('/promotions/new')}
                  className="w-full text-left px-4 py-3 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors"
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-white text-sm">%</span>
                    </div>
                    <div>
                      <div className="font-medium">Create Promotion</div>
                      <div className="text-sm text-orange-600">Set up discounts and coupons</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* System Status */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              System Status
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">API Gateway</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">Database</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">Payment Gateway</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">Email Service</span>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </>
  );
};

export default AdminDashboard;
