'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  HeartIcon,
  ShoppingCartIcon,
  TrashIcon,
  ShareIcon,
  EyeIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { customerApi } from '@/lib/api-client';

interface WishlistItem {
  id: string;
  product_id: string;
  product_name: string;
  product_image: string;
  price: number;
  original_price?: number;
  rating: number;
  reviews_count: number;
  category: string;
  brand: string;
  in_stock: boolean;
  discount_percentage?: number;
  added_at: string;
}

export function Wishlist() {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = async () => {
    try {
      setLoading(true);
      const response = await customerApi.getWishlist();
      
      if (response.success) {
        setWishlistItems(response.data.items || []);
      } else {
        throw new Error('Failed to load wishlist');
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Wishlist loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (productId: string) => {
    setUpdatingItems(prev => new Set(prev).add(productId));
    
    try {
      const response = await customerApi.removeFromWishlist(productId);
      
      if (response.success) {
        setWishlistItems(prev => prev.filter(item => item.product_id !== productId));
      } else {
        throw new Error('Failed to remove from wishlist');
      }
    } catch (err: any) {
      console.error('Remove from wishlist error:', err);
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  const addToCart = async (productId: string) => {
    setUpdatingItems(prev => new Set(prev).add(productId));
    
    try {
      const response = await customerApi.addToCart(productId, 1);
      
      if (response.success) {
        // Show success message
        // Optionally remove from wishlist after adding to cart
        // await removeFromWishlist(productId);
      } else {
        throw new Error('Failed to add to cart');
      }
    } catch (err: any) {
      console.error('Add to cart error:', err);
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  const addAllToCart = async () => {
    const inStockItems = wishlistItems.filter(item => item.in_stock);
    
    try {
      await Promise.all(
        inStockItems.map(item => customerApi.addToCart(item.product_id, 1))
      );
      // Show success message
    } catch (error) {
      console.error('Add all to cart failed:', error);
    }
  };

  const shareWishlist = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Wishlist',
          text: 'Check out my wishlist!',
          url: window.location.href,
        });
      } catch (error) {
        console.error('Share failed:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      // Show copied message
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6 animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
                <div className="aspect-square bg-gray-200 rounded-lg mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (wishlistItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">My Wishlist</h1>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <HeartIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Your wishlist is empty</h2>
            <p className="text-gray-600 mb-6">Save items you love to your wishlist</p>
            <Link
              href="/categories"
              className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              My Wishlist ({wishlistItems.length} items)
            </h1>
            <p className="text-gray-600">Items you've saved for later</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={shareWishlist}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <ShareIcon className="h-4 w-4" />
              <span>Share</span>
            </button>
            
            <button
              onClick={addAllToCart}
              disabled={!wishlistItems.some(item => item.in_stock)}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingCartIcon className="h-4 w-4" />
              <span>Add All to Cart</span>
            </button>
          </div>
        </div>

        {/* Wishlist Items */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlistItems.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden group">
              {/* Product Image */}
              <div className="relative aspect-square">
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500 text-sm">Product Image</span>
                </div>
                
                {/* Badges */}
                <div className="absolute top-2 left-2 flex flex-col space-y-1">
                  {item.discount_percentage && (
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">
                      -{item.discount_percentage}%
                    </span>
                  )}
                  {!item.in_stock && (
                    <span className="bg-gray-500 text-white text-xs px-2 py-1 rounded">
                      Out of Stock
                    </span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="absolute top-2 right-2 flex flex-col space-y-2">
                  <button
                    onClick={() => removeFromWishlist(item.product_id)}
                    disabled={updatingItems.has(item.product_id)}
                    className="p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <HeartSolidIcon className="h-4 w-4 text-red-500" />
                  </button>
                  
                  <Link
                    href={`/products/${item.product_id}`}
                    className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
                  >
                    <EyeIcon className="h-4 w-4 text-gray-600" />
                  </Link>
                </div>

                {/* Quick Add to Cart */}
                <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => addToCart(item.product_id)}
                    disabled={!item.in_stock || updatingItems.has(item.product_id)}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {updatingItems.has(item.product_id) ? 'Adding...' : 'Add to Cart'}
                  </button>
                </div>
              </div>

              {/* Product Info */}
              <div className="p-4">
                <div className="text-sm text-gray-500 mb-1">{item.category}</div>
                
                <Link
                  href={`/products/${item.product_id}`}
                  className="text-sm font-medium text-gray-900 hover:text-blue-600 line-clamp-2 mb-2"
                >
                  {item.product_name}
                </Link>
                
                <div className="text-xs text-gray-500 mb-2">{item.brand}</div>
                
                <div className="flex items-center mb-3">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon
                        key={i}
                        className={`h-3 w-3 ${
                          i < Math.floor(item.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-gray-500 ml-1">({item.reviews_count})</span>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-gray-900">${item.price}</span>
                    {item.original_price && item.original_price > item.price && (
                      <span className="text-sm text-gray-500 line-through">${item.original_price}</span>
                    )}
                  </div>
                  
                  {item.in_stock ? (
                    <span className="text-xs text-green-600 font-medium">In Stock</span>
                  ) : (
                    <span className="text-xs text-red-600 font-medium">Out of Stock</span>
                  )}
                </div>

                <div className="text-xs text-gray-500">
                  Added {new Date(item.added_at).toLocaleDateString()}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2 mt-4">
                  <button
                    onClick={() => addToCart(item.product_id)}
                    disabled={!item.in_stock || updatingItems.has(item.product_id)}
                    className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {updatingItems.has(item.product_id) ? 'Adding...' : 'Add to Cart'}
                  </button>
                  
                  <button
                    onClick={() => removeFromWishlist(item.product_id)}
                    disabled={updatingItems.has(item.product_id)}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    <TrashIcon className="h-4 w-4 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Continue Shopping */}
        <div className="mt-12 text-center">
          <Link
            href="/categories"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
          >
            Continue Shopping
          </Link>
        </div>

        {error && (
          <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 max-w-sm">
            <div className="text-red-800 font-medium">Error</div>
            <div className="text-red-600 text-sm mt-1">{error}</div>
          </div>
        )}
      </div>
    </div>
  );
}
