'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MagnifyingGlassIcon,
  ShoppingCartIcon,
  HeartIcon,
  UserIcon,
  Bars3Icon,
  XMarkIcon,
  BellIcon,
  GiftIcon,
} from '@heroicons/react/24/outline';
import { customerApi } from '../../lib/api-client';

export const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  
  const router = useRouter();

  // Load initial data
  useEffect(() => {
    loadUserData();
    loadCategories();
    loadCartData();
    loadWishlistData();
  }, []);

  const loadUserData = () => {
    const token = localStorage.getItem('customer_auth_token');
    const userData = localStorage.getItem('customer_user');
    
    if (token && userData) {
      setIsAuthenticated(true);
      setUser(JSON.parse(userData));
    }
  };

  const loadCategories = async () => {
    try {
      const response = await customerApi.getCategories();
      if (response.success) {
        setCategories(response.data.slice(0, 5)); // Show first 5 categories
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
      // Fallback categories
      setCategories([
        { id: 1, name: 'Electronics', slug: 'electronics' },
        { id: 2, name: 'Fashion', slug: 'fashion' },
        { id: 3, name: 'Home & Garden', slug: 'home-garden' },
        { id: 4, name: 'Sports', slug: 'sports' },
        { id: 5, name: 'Books', slug: 'books' },
      ]);
    }
  };

  const loadCartData = async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await customerApi.getCart();
      if (response.success) {
        const itemCount = response.data.items?.reduce((total: number, item: any) => total + item.quantity, 0) || 0;
        setCartCount(itemCount);
      }
    } catch (error) {
      console.error('Failed to load cart data:', error);
    }
  };

  const loadWishlistData = async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await customerApi.getWishlist();
      if (response.success) {
        setWishlistCount(response.data.items?.length || 0);
      }
    } catch (error) {
      console.error('Failed to load wishlist data:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await customerApi.logout();
      setIsAuthenticated(false);
      setUser(null);
      setCartCount(0);
      setWishlistCount(0);
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-50 bg-white transition-shadow duration-200 ${
      isScrolled ? 'shadow-md' : 'shadow-sm'
    }`}>
      {/* Top Bar */}
      <div className="bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-2 text-sm">
            <div className="flex items-center space-x-4">
              <span>Free shipping on orders over $50</span>
              <span className="hidden md:inline">•</span>
              <span className="hidden md:inline">24/7 Customer Support</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/help" className="hover:text-gray-300">
                Help
              </Link>
              <Link href="/contact" className="hover:text-gray-300">
                Contact
              </Link>
              <div className="flex items-center space-x-2">
                <span>🇺🇸 EN</span>
                <span>$ USD</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">E</span>
            </div>
            <span className="text-xl font-bold text-gray-900">ECommerce</span>
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden lg:flex flex-1 max-w-2xl mx-8">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search products..."
                className="w-full px-4 py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-4">
            {/* Search - Mobile */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="lg:hidden p-2 text-gray-600 hover:text-gray-900"
            >
              <MagnifyingGlassIcon className="h-6 w-6" />
            </button>

            {/* Notifications */}
            {isAuthenticated && (
              <div className="relative">
                <button className="relative p-2 text-gray-600 hover:text-gray-900">
                  <BellIcon className="h-6 w-6" />
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    3
                  </span>
                </button>
              </div>
            )}

            {/* Wishlist */}
            <Link
              href="/wishlist"
              className="relative p-2 text-gray-600 hover:text-gray-900"
            >
              <HeartIcon className="h-6 w-6" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart */}
            <div className="relative">
              <Link href="/cart" className="relative p-2 text-gray-600 hover:text-gray-900">
                <ShoppingCartIcon className="h-6 w-6" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>

            {/* User Account */}
            {isAuthenticated ? (
              <div className="relative group">
                <button className="flex items-center space-x-2 p-2 text-gray-600 hover:text-gray-900">
                  <UserIcon className="h-6 w-6" />
                  <span className="hidden md:inline text-sm">
                    Hi, {user?.first_name}
                  </span>
                </button>
                {/* User Dropdown */}
                <div className="absolute right-0 top-full mt-2 w-48 bg-white shadow-lg rounded-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="p-2">
                    <Link href="/account" className="block py-2 px-3 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded">
                      My Account
                    </Link>
                    <Link href="/orders" className="block py-2 px-3 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded">
                      My Orders
                    </Link>
                    <Link href="/wishlist" className="block py-2 px-3 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded">
                      Wishlist
                    </Link>
                    <hr className="my-2" />
                    <button 
                      onClick={handleLogout}
                      className="block w-full text-left py-2 px-3 text-gray-700 hover:text-red-600 hover:bg-gray-50 rounded"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/auth/login"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Sign In
                </Link>
                <span className="text-gray-300">|</span>
                <Link
                  href="/auth/register"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 text-gray-600 hover:text-gray-900"
            >
              {isMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="border-t border-gray-200">
        <div className="container mx-auto px-4">
          <div className="hidden lg:flex items-center justify-between py-3">
            {/* Categories */}
            <div className="flex items-center space-x-8">
              <div className="relative group">
                <button className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 font-medium">
                  <Bars3Icon className="h-4 w-4" />
                  <span>Categories</span>
                </button>
                {/* Categories Dropdown */}
                <div className="absolute top-full left-0 mt-2 w-64 bg-white shadow-lg rounded-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="p-4">
                    {categories.map((category) => (
                      <Link
                        key={category.id}
                        href={`/categories/${category.slug}`}
                        className="block py-2 px-3 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded"
                      >
                        {category.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/categories/${category.slug}`}
                  className="text-gray-700 hover:text-blue-600 font-medium"
                >
                  {category.name}
                </Link>
              ))}
            </div>

            {/* Special Links */}
            <div className="flex items-center space-x-6">
              <Link
                href="/promotions"
                className="flex items-center space-x-1 text-red-600 hover:text-red-700 font-medium"
              >
                <GiftIcon className="h-4 w-4" />
                <span>Flash Sales</span>
              </Link>
              <Link
                href="/deals"
                className="text-gray-700 hover:text-blue-600 font-medium"
              >
                Daily Deals
              </Link>
              <Link
                href="/new-arrivals"
                className="text-gray-700 hover:text-blue-600 font-medium"
              >
                New Arrivals
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-200">
          <div className="container mx-auto px-4 py-4">
            <div className="space-y-4">
              {/* Categories */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Categories</h3>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <Link
                      key={category.id}
                      href={`/categories/${category.slug}`}
                      className="block py-2 text-gray-600 hover:text-blue-600"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Special Links */}
              <div className="border-t border-gray-200 pt-4">
                <Link
                  href="/promotions"
                  className="block py-2 text-red-600 hover:text-red-700 font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  🎁 Flash Sales
                </Link>
                <Link
                  href="/deals"
                  className="block py-2 text-gray-600 hover:text-blue-600"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Daily Deals
                </Link>
                <Link
                  href="/new-arrivals"
                  className="block py-2 text-gray-600 hover:text-blue-600"
                  onClick={() => setIsMenuOpen(false)}
                >
                  New Arrivals
                </Link>
              </div>

              {/* Account Links */}
              {!isAuthenticated && (
                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <Link
                    href="/auth/login"
                    className="block py-2 text-gray-600 hover:text-blue-600"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/register"
                    className="block py-2 text-blue-600 hover:text-blue-700 font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Search Overlay */}
      {isSearchOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-white">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Search Products</h2>
            <button
              onClick={() => setIsSearchOpen(false)}
              className="p-2 text-gray-600 hover:text-gray-900"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <div className="p-4">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search products..."
                className="w-full px-4 py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
