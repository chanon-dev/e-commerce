'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  ShoppingBagIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  MegaphoneIcon,
  CreditCardIcon,
  ChartBarIcon,
  CogIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  BellIcon,
  TruckIcon,
  DocumentChartBarIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';

interface MenuItem {
  name: string;
  href: string;
  icon: any;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: HomeIcon,
    children: [
      { name: 'Overview', href: '/admin', icon: ChartBarIcon },
      { name: 'Sales Summary', href: '/admin/sales', icon: ChartBarIcon },
      { name: 'Order Statistics', href: '/admin/orders/stats', icon: ClipboardDocumentListIcon },
      { name: 'Customer Metrics', href: '/admin/customers/metrics', icon: UsersIcon },
      { name: 'Revenue Analytics', href: '/admin/revenue', icon: ChartBarIcon },
    ],
  },
  {
    name: 'Products',
    href: '/admin/products',
    icon: ShoppingBagIcon,
    children: [
      { name: 'Product List', href: '/admin/products', icon: ShoppingBagIcon },
      { name: 'Add Product', href: '/admin/products/add', icon: ShoppingBagIcon },
      { name: 'Categories', href: '/admin/products/categories', icon: ShoppingBagIcon },
      { name: 'Inventory Management', href: '/admin/products/inventory', icon: ShoppingBagIcon },
      { name: 'Bulk Import/Export', href: '/admin/products/bulk', icon: ShoppingBagIcon },
      { name: 'Product Analytics', href: '/admin/products/analytics', icon: ChartBarIcon },
    ],
  },
  {
    name: 'Orders',
    href: '/admin/orders',
    icon: ClipboardDocumentListIcon,
    children: [
      { name: 'Order List', href: '/admin/orders', icon: ClipboardDocumentListIcon },
      { name: 'Order Details', href: '/admin/orders/details', icon: ClipboardDocumentListIcon },
      { name: 'Order Processing', href: '/admin/orders/processing', icon: ClipboardDocumentListIcon },
      { name: 'Shipping Management', href: '/admin/orders/shipping', icon: TruckIcon },
      { name: 'Returns & Refunds', href: '/admin/orders/returns', icon: ClipboardDocumentListIcon },
      { name: 'Order Analytics', href: '/admin/orders/analytics', icon: ChartBarIcon },
    ],
  },
  {
    name: 'Customers',
    href: '/admin/customers',
    icon: UsersIcon,
    children: [
      { name: 'Customer List', href: '/admin/customers', icon: UsersIcon },
      { name: 'Customer Details', href: '/admin/customers/details', icon: UsersIcon },
      { name: 'Customer Analytics', href: '/admin/customers/analytics', icon: ChartBarIcon },
      { name: 'Customer Support', href: '/admin/customers/support', icon: UsersIcon },
      { name: 'Customer Segmentation', href: '/admin/customers/segmentation', icon: UsersIcon },
    ],
  },
  {
    name: 'Marketing',
    href: '/admin/marketing',
    icon: MegaphoneIcon,
    children: [
      { name: 'Promotions', href: '/admin/marketing/promotions', icon: MegaphoneIcon },
      { name: 'Coupons', href: '/admin/marketing/coupons', icon: MegaphoneIcon },
      { name: 'Flash Sales', href: '/admin/marketing/flash-sales', icon: MegaphoneIcon },
      { name: 'Email Campaigns', href: '/admin/marketing/email', icon: MegaphoneIcon },
      { name: 'Loyalty Program', href: '/admin/marketing/loyalty', icon: MegaphoneIcon },
      { name: 'Marketing Analytics', href: '/admin/marketing/analytics', icon: ChartBarIcon },
    ],
  },
  {
    name: 'Payments',
    href: '/admin/payments',
    icon: CreditCardIcon,
    children: [
      { name: 'Payment Transactions', href: '/admin/payments', icon: CreditCardIcon },
      { name: 'Refunds', href: '/admin/payments/refunds', icon: CreditCardIcon },
      { name: 'Payment Methods', href: '/admin/payments/methods', icon: CreditCardIcon },
      { name: 'Payment Analytics', href: '/admin/payments/analytics', icon: ChartBarIcon },
      { name: 'Fraud Detection', href: '/admin/payments/fraud', icon: ShieldCheckIcon },
    ],
  },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    icon: ChartBarIcon,
    children: [
      { name: 'Sales Reports', href: '/admin/analytics/sales', icon: ChartBarIcon },
      { name: 'Product Performance', href: '/admin/analytics/products', icon: ChartBarIcon },
      { name: 'Customer Behavior', href: '/admin/analytics/customers', icon: ChartBarIcon },
      { name: 'Inventory Reports', href: '/admin/analytics/inventory', icon: ChartBarIcon },
      { name: 'Financial Reports', href: '/admin/analytics/financial', icon: ChartBarIcon },
    ],
  },
  {
    name: 'System',
    href: '/admin/system',
    icon: CogIcon,
    children: [
      { name: 'System Configuration', href: '/admin/system/config', icon: CogIcon },
      { name: 'User Management', href: '/admin/system/users', icon: UsersIcon },
      { name: 'Role Management', href: '/admin/system/roles', icon: ShieldCheckIcon },
      { name: 'API Management', href: '/admin/system/api', icon: WrenchScrewdriverIcon },
      { name: 'System Health', href: '/admin/system/health', icon: CogIcon },
    ],
  },
  {
    name: 'Security',
    href: '/admin/security',
    icon: ShieldCheckIcon,
    children: [
      { name: 'Secrets Management', href: '/admin/security/vault', icon: ShieldCheckIcon },
      { name: 'Identity Management', href: '/admin/security/keycloak', icon: ShieldCheckIcon },
      { name: 'Access Control', href: '/admin/security/access', icon: ShieldCheckIcon },
      { name: 'Audit Logs', href: '/admin/security/audit', icon: DocumentTextIcon },
      { name: 'Security Alerts', href: '/admin/security/alerts', icon: BellIcon },
    ],
  },
  {
    name: 'Content',
    href: '/admin/content',
    icon: DocumentTextIcon,
    children: [
      { name: 'Reviews Management', href: '/admin/content/reviews', icon: DocumentTextIcon },
      { name: 'Content Moderation', href: '/admin/content/moderation', icon: DocumentTextIcon },
      { name: 'SEO Management', href: '/admin/content/seo', icon: DocumentTextIcon },
      { name: 'Media Library', href: '/admin/content/media', icon: DocumentTextIcon },
    ],
  },
  {
    name: 'Notifications',
    href: '/admin/notifications',
    icon: BellIcon,
    children: [
      { name: 'Email Templates', href: '/admin/notifications/email', icon: BellIcon },
      { name: 'SMS Templates', href: '/admin/notifications/sms', icon: BellIcon },
      { name: 'Push Notifications', href: '/admin/notifications/push', icon: BellIcon },
      { name: 'Notification History', href: '/admin/notifications/history', icon: BellIcon },
    ],
  },
  {
    name: 'Shipping',
    href: '/admin/shipping',
    icon: TruckIcon,
    children: [
      { name: 'Shipping Methods', href: '/admin/shipping/methods', icon: TruckIcon },
      { name: 'Carrier Management', href: '/admin/shipping/carriers', icon: TruckIcon },
      { name: 'Shipping Rates', href: '/admin/shipping/rates', icon: TruckIcon },
      { name: 'Delivery Tracking', href: '/admin/shipping/tracking', icon: TruckIcon },
    ],
  },
  {
    name: 'Reports',
    href: '/admin/reports',
    icon: DocumentChartBarIcon,
    children: [
      { name: 'Sales Reports', href: '/admin/reports/sales', icon: DocumentChartBarIcon },
      { name: 'Inventory Reports', href: '/admin/reports/inventory', icon: DocumentChartBarIcon },
      { name: 'Customer Reports', href: '/admin/reports/customers', icon: DocumentChartBarIcon },
      { name: 'Financial Reports', href: '/admin/reports/financial', icon: DocumentChartBarIcon },
      { name: 'Custom Reports', href: '/admin/reports/custom', icon: DocumentChartBarIcon },
    ],
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: WrenchScrewdriverIcon,
    children: [
      { name: 'General Settings', href: '/admin/settings/general', icon: WrenchScrewdriverIcon },
      { name: 'Payment Settings', href: '/admin/settings/payment', icon: CreditCardIcon },
      { name: 'Shipping Settings', href: '/admin/settings/shipping', icon: TruckIcon },
      { name: 'Notification Settings', href: '/admin/settings/notifications', icon: BellIcon },
      { name: 'Security Settings', href: '/admin/settings/security', icon: ShieldCheckIcon },
      { name: 'Integration Settings', href: '/admin/settings/integrations', icon: WrenchScrewdriverIcon },
    ],
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['Dashboard']);
  const pathname = usePathname();

  const toggleMenu = (menuName: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuName)
        ? prev.filter(name => name !== menuName)
        : [...prev, menuName]
    );
  };

  const isActiveLink = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Admin</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <div key={item.name}>
              <button
                onClick={() => toggleMenu(item.name)}
                className={`w-full flex items-center justify-between px-2 py-2 text-sm font-medium rounded-md ${
                  isActiveLink(item.href)
                    ? 'bg-blue-100 text-blue-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center">
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </div>
                {item.children && (
                  <svg
                    className={`h-4 w-4 transform transition-transform ${
                      expandedMenus.includes(item.name) ? 'rotate-90' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </button>

              {item.children && expandedMenus.includes(item.name) && (
                <div className="ml-6 mt-1 space-y-1">
                  {item.children.map((child) => (
                    <Link
                      key={child.name}
                      href={child.href}
                      className={`flex items-center px-2 py-2 text-sm rounded-md ${
                        isActiveLink(child.href)
                          ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <child.icon className="mr-3 h-4 w-4" />
                      {child.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <button className="p-2 text-gray-400 hover:text-gray-500">
                  <BellIcon className="h-6 w-6" />
                  <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
                </button>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <UsersIcon className="h-5 w-5 text-gray-600" />
                </div>
                <div className="hidden md:block">
                  <div className="text-sm font-medium text-gray-900">Admin User</div>
                  <div className="text-xs text-gray-500">admin@example.com</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
