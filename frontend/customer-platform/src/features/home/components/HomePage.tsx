'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ChevronRightIcon,
  StarIcon,
  HeartIcon,
  ShoppingCartIcon,
  FireIcon,
  TagIcon,
  TruckIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { customerApi } from '@/lib/api-client';

interface Product {
  id: string;
  name: string;
  price: number;
  original_price?: number;
  image: string;
  rating: number;
  reviews_count: number;
  category: string;
  is_new: boolean;
  is_sale: boolean;
  discount_percentage?: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  product_count: number;
}

interface Banner {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  link: string;
  button_text: string;
}

export function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [flashSaleProducts, setFlashSaleProducts] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      setLoading(true);
      
      const [
        categoriesResponse,
        featuredResponse,
        flashSaleResponse,
        newArrivalsResponse,
      ] = await Promise.allSettled([
        customerApi.getCategories(),
        customerApi.getProducts({ featured: true, per_page: 8 }),
        customerApi.getProducts({ flash_sale: true, per_page: 6 }),
        customerApi.getProducts({ new_arrivals: true, per_page: 8 }),
      ]);

      // Handle categories
      if (categoriesResponse.status === 'fulfilled' && categoriesResponse.value.success) {
        setCategories(categoriesResponse.value.data.slice(0, 6));
      }

      // Handle featured products
      if (featuredResponse.status === 'fulfilled' && featuredResponse.value.success) {
        setFeaturedProducts(featuredResponse.value.data.data || []);
      }

      // Handle flash sale products
      if (flashSaleResponse.status === 'fulfilled' && flashSaleResponse.value.success) {
        setFlashSaleProducts(flashSaleResponse.value.data.data || []);
      }

      // Handle new arrivals
      if (newArrivalsResponse.status === 'fulfilled' && newArrivalsResponse.value.success) {
        setNewArrivals(newArrivalsResponse.value.data.data || []);
      }

      // Mock banners data
      setBanners([
        {
          id: '1',
          title: 'Summer Sale',
          subtitle: 'Up to 70% off on selected items',
          image: '/api/placeholder/800/400',
          link: '/promotions/summer-sale',
          button_text: 'Shop Now',
        },
        {
          id: '2',
          title: 'New Collection',
          subtitle: 'Discover the latest trends',
          image: '/api/placeholder/800/400',
          link: '/promotions/new-collection',
          button_text: 'Explore',
        },
      ]);

    } catch (err: any) {
      setError(err.message);
      console.error('Home data loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (productId: string) => {
    try {
      await customerApi.addToCart(productId, 1);
      // Show success message
    } catch (error) {
      console.error('Add to cart failed:', error);
    }
  };

  const handleAddToWishlist = async (productId: string) => {
    try {
      await customerApi.addToWishlist(productId);
      // Show success message
    } catch (error) {
      console.error('Add to wishlist failed:', error);
    }
  };

  const ProductCard = ({ product }: { product: Product }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden group hover:shadow-md transition-shadow">
      <div className="relative">
        <div className="aspect-square bg-gray-200 flex items-center justify-center">
          <span className="text-gray-500 text-sm">Product Image</span>
        </div>
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col space-y-1">
          {product.is_new && (
            <span className="bg-green-500 text-white text-xs px-2 py-1 rounded">New</span>
          )}
          {product.is_sale && product.discount_percentage && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">
              -{product.discount_percentage}%
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="absolute top-2 right-2 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => handleAddToWishlist(product.id)}
            className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50"
          >
            <HeartIcon className="h-4 w-4 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="text-sm text-gray-500 mb-1">{product.category}</div>
        <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">{product.name}</h3>
        
        <div className="flex items-center mb-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <StarIcon
                key={i}
                className={`h-4 w-4 ${
                  i < Math.floor(product.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-500 ml-2">({product.reviews_count})</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold text-gray-900">${product.price}</span>
            {product.original_price && (
              <span className="text-sm text-gray-500 line-through">${product.original_price}</span>
            )}
          </div>
          <button
            onClick={() => handleAddToCart(product.id)}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ShoppingCartIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen">
        {/* Hero skeleton */}
        <div className="h-96 bg-gray-200 animate-pulse"></div>
        
        {/* Content skeleton */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse"></div>
            ))}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-80 bg-gray-200 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Banners */}
      <section className="relative">
        <div className="h-96 md:h-[500px] bg-gradient-to-r from-blue-600 to-purple-600 flex items-center">
          <div className="max-w-7xl mx-auto px-4 w-full">
            <div className="text-white max-w-2xl">
              <h1 className="text-4xl md:text-6xl font-bold mb-4">
                Summer Sale
              </h1>
              <p className="text-xl md:text-2xl mb-8">
                Up to 70% off on selected items
              </p>
              <Link
                href="/promotions/summer-sale"
                className="inline-flex items-center bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Shop Now
                <ChevronRightIcon className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-8 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <TruckIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Free Shipping</h3>
                <p className="text-gray-600">On orders over $50</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-full">
                <ShieldCheckIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Secure Payment</h3>
                <p className="text-gray-600">100% secure transactions</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-100 rounded-full">
                <TagIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Best Prices</h3>
                <p className="text-gray-600">Guaranteed lowest prices</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Shop by Category</h2>
            <Link href="/categories" className="text-blue-600 hover:text-blue-700 font-medium">
              View All
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="group text-center"
              >
                <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                  <span className="text-gray-500">Category</span>
                </div>
                <h3 className="font-medium text-gray-900 group-hover:text-blue-600">
                  {category.name}
                </h3>
                <p className="text-sm text-gray-500">{category.product_count} items</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Flash Sale */}
      {flashSaleProducts.length > 0 && (
        <section className="py-12 bg-red-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <FireIcon className="h-8 w-8 text-red-500" />
                <h2 className="text-2xl font-bold text-gray-900">Flash Sale</h2>
                <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Limited Time
                </div>
              </div>
              <Link href="/promotions/flash-sales" className="text-red-600 hover:text-red-700 font-medium">
                View All
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
              {flashSaleProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Featured Products</h2>
            <Link href="/products" className="text-blue-600 hover:text-blue-700 font-medium">
              View All
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      {newArrivals.length > 0 && (
        <section className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">New Arrivals</h2>
              <Link href="/promotions/new-arrivals" className="text-blue-600 hover:text-blue-700 font-medium">
                View All
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {newArrivals.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Newsletter */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Stay Updated with Our Latest Offers
          </h2>
          <p className="text-blue-100 mb-8">
            Subscribe to our newsletter and get exclusive deals and updates
          </p>
          <div className="flex flex-col sm:flex-row max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-l-lg sm:rounded-r-none rounded-r-lg border-0 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <button className="bg-blue-800 text-white px-6 py-3 rounded-r-lg sm:rounded-l-none rounded-l-lg hover:bg-blue-900 transition-colors">
              Subscribe
            </button>
          </div>
        </div>
      </section>

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 max-w-sm">
          <div className="text-red-800 font-medium">Error</div>
          <div className="text-red-600 text-sm mt-1">{error}</div>
        </div>
      )}
    </div>
  );
}
