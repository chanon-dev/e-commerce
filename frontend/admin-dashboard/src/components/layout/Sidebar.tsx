'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  ChartBarIcon,
  ShoppingBagIcon,
  ClipboardDocumentListIcon,
  UsersIcon,
  MegaphoneIcon,
  CreditCardIcon,
  TruckIcon,
  DocumentTextIcon,
  BellIcon,
  CogIcon,
  ShieldCheckIcon,
  DocumentDuplicateIcon,
  BuildingStorefrontIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

interface MenuItem {
  name: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: MenuItem[];
  badge?: string | number;
}

const menuItems: MenuItem[] = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: HomeIcon,
  },
  {
    name: 'Analytics',
    icon: ChartBarIcon,
    children: [
      { name: 'Overview', href: '/admin/analytics', icon: ChartBarIcon },
      { name: 'Sales Reports', href: '/admin/analytics/sales', icon: DocumentTextIcon },
      { name: 'Product Performance', href: '/admin/analytics/products', icon: ShoppingBagIcon },
      { name: 'Customer Behavior', href: '/admin/analytics/customers', icon: UsersIcon },
      { name: 'Inventory Reports', href: '/admin/analytics/inventory', icon: ClipboardDocumentListIcon },
      { name: 'Financial Reports', href: '/admin/analytics/financial', icon: CreditCardIcon },
    ],
  },
  {
    name: 'Products',
    icon: ShoppingBagIcon,
    children: [
      { name: 'Product List', href: '/admin/products', icon: ShoppingBagIcon },
      { name: 'Add Product', href: '/admin/products/add', icon: ShoppingBagIcon },
      { name: 'Categories', href: '/admin/products/categories', icon: ShoppingBagIcon },
      { name: 'Inventory Management', href: '/admin/products/inventory', icon: ClipboardDocumentListIcon },
      { name: 'Bulk Import/Export', href: '/admin/products/bulk', icon: DocumentDuplicateIcon },
      { name: 'Product Analytics', href: '/admin/products/analytics', icon: ChartBarIcon },
    ],
  },
  {
    name: 'Orders',
    icon: ClipboardDocumentListIcon,
    badge: '12',
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
    name: 'Shipping',
    icon: TruckIcon,
    children: [
      { name: 'Shipping Methods', href: '/admin/shipping/methods', icon: TruckIcon },
      { name: 'Carrier Management', href: '/admin/shipping/carriers', icon: TruckIcon },
      { name: 'Shipping Rates', href: '/admin/shipping/rates', icon: TruckIcon },
      { name: 'Delivery Tracking', href: '/admin/shipping/tracking', icon: TruckIcon },
    ],
  },
  {
    name: 'Content',
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
    icon: BellIcon,
    badge: '5',
    children: [
      { name: 'Email Templates', href: '/admin/notifications/email', icon: BellIcon },
      { name: 'SMS Templates', href: '/admin/notifications/sms', icon: BellIcon },
      { name: 'Push Notifications', href: '/admin/notifications/push', icon: BellIcon },
      { name: 'Notification History', href: '/admin/notifications/history', icon: BellIcon },
    ],
  },
  {
    name: 'Reports',
    icon: DocumentTextIcon,
    children: [
      { name: 'Sales Reports', href: '/admin/reports/sales', icon: DocumentTextIcon },
      { name: 'Inventory Reports', href: '/admin/reports/inventory', icon: DocumentTextIcon },
      { name: 'Customer Reports', href: '/admin/reports/customers', icon: DocumentTextIcon },
      { name: 'Financial Reports', href: '/admin/reports/financial', icon: DocumentTextIcon },
      { name: 'Custom Reports', href: '/admin/reports/custom', icon: DocumentTextIcon },
    ],
  },
  {
    name: 'System',
    icon: CogIcon,
    children: [
      { name: 'System Configuration', href: '/admin/system/config', icon: CogIcon },
      { name: 'User Management', href: '/admin/system/users', icon: UsersIcon },
      { name: 'Role Management', href: '/admin/system/roles', icon: ShieldCheckIcon },
      { name: 'API Management', href: '/admin/system/api', icon: CogIcon },
      { name: 'System Health', href: '/admin/system/health', icon: CogIcon },
    ],
  },
  {
    name: 'Security',
    icon: ShieldCheckIcon,
    children: [
      { name: 'Secrets Management', href: '/admin/security/vault', icon: ShieldCheckIcon },
      { name: 'Identity Management', href: '/admin/security/keycloak', icon: ShieldCheckIcon },
      { name: 'Access Control', href: '/admin/security/access', icon: ShieldCheckIcon },
      { name: 'Audit Logs', href: '/admin/security/audit', icon: ShieldCheckIcon },
      { name: 'Security Alerts', href: '/admin/security/alerts', icon: ShieldCheckIcon },
    ],
  },
  {
    name: 'Settings',
    icon: CogIcon,
    children: [
      { name: 'General Settings', href: '/admin/settings/general', icon: CogIcon },
      { name: 'Payment Settings', href: '/admin/settings/payment', icon: CreditCardIcon },
      { name: 'Shipping Settings', href: '/admin/settings/shipping', icon: TruckIcon },
      { name: 'Notification Settings', href: '/admin/settings/notifications', icon: BellIcon },
      { name: 'Security Settings', href: '/admin/settings/security', icon: ShieldCheckIcon },
      { name: 'Integration Settings', href: '/admin/settings/integrations', icon: CogIcon },
    ],
  },
];

interface SidebarProps {
  isCollapsed: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed }) => {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev =>
      prev.includes(itemName)
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    );
  };

  const isActive = (href?: string) => {
    if (!href) return false;
    return pathname === href || pathname.startsWith(href + '/');
  };

  const isParentActive = (children?: MenuItem[]) => {
    if (!children) return false;
    return children.some(child => isActive(child.href));
  };

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.name);
    const itemIsActive = isActive(item.href);
    const parentIsActive = isParentActive(item.children);

    if (hasChildren) {
      return (
        <div key={item.name}>
          <button
            onClick={() => toggleExpanded(item.name)}
            className={clsx(
              'w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors',
              parentIsActive
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
              level > 0 && 'ml-4'
            )}
          >
            <div className="flex items-center">
              <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
              {!isCollapsed && (
                <>
                  <span>{item.name}</span>
                  {item.badge && (
                    <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </div>
            {!isCollapsed && (
              <div className="flex-shrink-0">
                {isExpanded ? (
                  <ChevronDownIcon className="h-4 w-4" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4" />
                )}
              </div>
            )}
          </button>
          {!isCollapsed && isExpanded && (
            <div className="mt-1 space-y-1">
              {item.children?.map(child => renderMenuItem(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.name}
        href={item.href!}
        className={clsx(
          'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
          itemIsActive
            ? 'bg-blue-100 text-blue-700'
            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
          level > 0 && 'ml-4'
        )}
      >
        <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
        {!isCollapsed && (
          <>
            <span>{item.name}</span>
            {item.badge && (
              <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {item.badge}
              </span>
            )}
          </>
        )}
      </Link>
    );
  };

  return (
    <div
      className={clsx(
        'bg-white border-r border-gray-200 transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center px-4 py-4 border-b border-gray-200">
          <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <BuildingStorefrontIcon className="h-5 w-5 text-white" />
          </div>
          {!isCollapsed && (
            <div className="ml-3">
              <h1 className="text-lg font-bold text-gray-900">Admin Panel</h1>
              <p className="text-xs text-gray-500">E-commerce Dashboard</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
          {menuItems.map(item => renderMenuItem(item))}
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-gray-300 rounded-full flex-shrink-0"></div>
            {!isCollapsed && (
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Admin User</p>
                <p className="text-xs text-gray-500">admin@example.com</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
