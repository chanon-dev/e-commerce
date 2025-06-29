'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../../shared/lib/auth-provider';
import { useCart } from '../providers/cart-provider';
import { useCategories } from '../../../../../shared/services/product.service';
import { SearchBar } from '../common/search-bar';
import { CartDropdown } from '../common/cart-dropdown';
import { UserMenu } from '../common/user-menu';
import { MobileMenu } from '../common/mobile-menu';
import { NotificationBell } from '../common/notification-bell';

export const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  const { isAuthenticated, user } = useAuth();
  const { getCartSummary } = useCart();
  const { data: categories } = useCategories();
  const router = useRouter();

  const cartSummary = getCartSummary();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [router]);

  const mainCategories = categories?.data?.filter(cat => !cat.parent_id).slice(0, 6) || [];

  return (
    <>
      {/* Top Bar */}
      <div className="bg-gray-900 text-white text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-10">
            <div className="flex items-center space-x-6">
              <span>Free shipping on orders over $50</span>
              <span className="hidden sm:inline">|</span>
              <span className="hidden sm:inline">24/7 Customer Support</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/help" className="hover:text-gray-300">
                Help
              </Link>
              <span>|</span>
              <Link href="/track-order" className="hover:text-gray-300">
                Track Order
              </Link>
              {!isAuthenticated && (
                <>
                  <span>|</span>
                  <Link href="/auth/login" className="hover:text-gray-300">
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header
        className={`sticky top-0 z-40 bg-white border-b transition-shadow duration-200 ${
          isScrolled ? 'shadow-md' : ''
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">E</span>
                </div>
                <span className="text-xl font-bold text-gray-900 hidden sm:block">
                  E-commerce
                </span>
              </Link>
            </div>

            {/* Search Bar - Desktop */}
            <div className="hidden md:block flex-1 max-w-2xl mx-8">
              <SearchBar />
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-4">
              {/* Search Icon - Mobile */}
              <button
                className="md:hidden p-2 text-gray-600 hover:text-gray-900"
                onClick={() => {
                  // Toggle mobile search
                }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              {/* Notifications */}
              {isAuthenticated && <NotificationBell />}

              {/* Wishlist */}
              <Link
                href="/wishlist"
                className="p-2 text-gray-600 hover:text-gray-900 relative"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </Link>

              {/* Cart */}
              <div className="relative">
                <button
                  onClick={() => setIsCartOpen(!isCartOpen)}
                  className="p-2 text-gray-600 hover:text-gray-900 relative"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                  </svg>
                  {cartSummary.itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {cartSummary.itemCount > 99 ? '99+' : cartSummary.itemCount}
                    </span>
                  )}
                </button>
                <CartDropdown isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
              </div>

              {/* User Menu */}
              {isAuthenticated ? (
                <UserMenu user={user} />
              ) : (
                <div className="hidden sm:flex items-center space-x-2">
                  <Link
                    href="/auth/login"
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/register"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                  >
                    Sign Up
                  </Link>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-gray-600 hover:text-gray-900"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Menu - Desktop */}
        <div className="hidden md:block border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center space-x-8 h-12">
              <Link
                href="/categories"
                className="text-gray-900 hover:text-blue-600 px-3 py-2 text-sm font-medium flex items-center space-x-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
                <span>All Categories</span>
              </Link>

              {mainCategories.map((category) => (
                <Link
                  key={category.id}
                  href={`/categories/${category.slug}`}
                  className="text-gray-600 hover:text-blue-600 px-3 py-2 text-sm font-medium"
                >
                  {category.name}
                </Link>
              ))}

              <Link
                href="/deals"
                className="text-red-600 hover:text-red-700 px-3 py-2 text-sm font-medium"
              >
                🔥 Deals
              </Link>

              <Link
                href="/new-arrivals"
                className="text-green-600 hover:text-green-700 px-3 py-2 text-sm font-medium"
              >
                ✨ New Arrivals
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        categories={mainCategories}
        isAuthenticated={isAuthenticated}
        user={user}
      />

      {/* Mobile Search Overlay */}
      <div className="md:hidden">
        {/* This would be implemented as a full-screen search overlay */}
      </div>

      {/* Announcement Bar */}
      <div className="bg-blue-600 text-white text-center py-2 text-sm">
        <div className="max-w-7xl mx-auto px-4">
          <span>🎉 Black Friday Sale: Up to 70% off! </span>
          <Link href="/sale" className="underline font-medium">
            Shop Now
          </Link>
        </div>
      </div>
    </>
  );
};

export default Header;
