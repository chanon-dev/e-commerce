'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from '../../../../shared/lib/auth-provider';
import { CartService, Cart, CartItem, CartUtils } from '../../../../shared/services/cart.service';
import { toast } from 'react-hot-toast';

// Cart Context Types
export interface CartContextType {
  cart: Cart | null;
  isLoading: boolean;
  error: string | null;
  
  // Cart actions
  addToCart: (productId: string, quantity: number, variantId?: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  
  // Coupon actions
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => Promise<void>;
  
  // Shipping actions
  setShippingMethod: (method: string) => Promise<void>;
  
  // Cart utilities
  getItemQuantity: (productId: string, variantId?: string) => number;
  isProductInCart: (productId: string, variantId?: string) => boolean;
  getCartSummary: () => {
    itemCount: number;
    subtotal: number;
    total: number;
    currency: string;
    hasDiscount: boolean;
    discountAmount: number;
  };
  
  // Cart validation
  validateCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

// Context
const CartContext = createContext<CartContextType | undefined>(undefined);

// Provider Props
interface CartProviderProps {
  children: ReactNode;
}

// Cart Provider Component
export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { isAuthenticated, user } = useAuth();

  // Initialize cart
  useEffect(() => {
    initializeCart();
  }, [isAuthenticated]);

  // Auto-save cart for guest users
  useEffect(() => {
    if (cart && !isAuthenticated) {
      CartUtils.saveToLocalStorage(cart);
    }
  }, [cart, isAuthenticated]);

  // Periodic cart validation
  useEffect(() => {
    if (cart && CartUtils.needsValidation(cart)) {
      validateCart();
    }
  }, [cart]);

  const initializeCart = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (isAuthenticated) {
        // Load user's cart from server
        await loadServerCart();
      } else {
        // Load guest cart from localStorage
        loadGuestCart();
      }
    } catch (error: any) {
      console.error('Failed to initialize cart:', error);
      setError('Failed to load cart');
    } finally {
      setIsLoading(false);
    }
  };

  const loadServerCart = async () => {
    try {
      const response = await CartService.getCart();
      setCart(response.data);
    } catch (error: any) {
      if (error.status === 404) {
        // No cart exists, create empty cart
        setCart(null);
      } else {
        throw error;
      }
    }
  };

  const loadGuestCart = () => {
    const guestCart = CartUtils.loadFromLocalStorage();
    setCart(guestCart);
  };

  const refreshCart = async () => {
    if (isAuthenticated) {
      await loadServerCart();
    } else {
      loadGuestCart();
    }
  };

  const addToCart = async (productId: string, quantity: number, variantId?: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await CartService.addToCart({
        product_id: productId,
        variant_id: variantId,
        quantity,
      });

      setCart(response.data);
      toast.success('Item added to cart!');

      // Track analytics event
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'add_to_cart', {
          currency: response.data.currency,
          value: response.data.totals.total,
          items: [{
            item_id: productId,
            item_name: response.data.items.find(item => item.product_id === productId)?.product.name,
            quantity: quantity,
          }],
        });
      }

    } catch (error: any) {
      const errorMessage = error.message || 'Failed to add item to cart';
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    try {
      setIsLoading(true);
      setError(null);

      if (quantity <= 0) {
        await removeItem(itemId);
        return;
      }

      const response = await CartService.updateCartItem(itemId, { quantity });
      setCart(response.data);
      toast.success('Cart updated!');

    } catch (error: any) {
      const errorMessage = error.message || 'Failed to update cart';
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await CartService.removeCartItem(itemId);
      setCart(response.data);
      toast.success('Item removed from cart');

    } catch (error: any) {
      const errorMessage = error.message || 'Failed to remove item';
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = async () => {
    try {
      setIsLoading(true);
      setError(null);

      await CartService.clearCart();
      setCart(null);
      
      // Clear localStorage for guest users
      if (!isAuthenticated) {
        CartUtils.clearLocalStorage();
      }
      
      toast.success('Cart cleared');

    } catch (error: any) {
      const errorMessage = error.message || 'Failed to clear cart';
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const applyCoupon = async (code: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await CartService.applyCoupon({ code });
      setCart(response.data);
      toast.success('Coupon applied successfully!');

    } catch (error: any) {
      const errorMessage = error.message || 'Failed to apply coupon';
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const removeCoupon = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await CartService.removeCoupon();
      setCart(response.data);
      toast.success('Coupon removed');

    } catch (error: any) {
      const errorMessage = error.message || 'Failed to remove coupon';
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const setShippingMethod = async (method: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await CartService.setShippingMethod(method);
      setCart(response.data);
      toast.success('Shipping method updated');

    } catch (error: any) {
      const errorMessage = error.message || 'Failed to set shipping method';
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const validateCart = async () => {
    try {
      const response = await CartService.validateCart();
      
      if (response.data.has_changes) {
        setCart(response.data.cart);
        toast.warning('Cart has been updated due to price or availability changes');
      }

    } catch (error: any) {
      console.error('Cart validation failed:', error);
      // Don't show error toast for validation failures
    }
  };

  // Utility functions
  const getItemQuantity = (productId: string, variantId?: string): number => {
    return CartUtils.getItemQuantity(cart, productId, variantId);
  };

  const isProductInCart = (productId: string, variantId?: string): boolean => {
    return CartUtils.isProductInCart(cart, productId, variantId);
  };

  const getCartSummary = () => {
    return CartUtils.getCartSummary(cart);
  };

  const contextValue: CartContextType = {
    cart,
    isLoading,
    error,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    applyCoupon,
    removeCoupon,
    setShippingMethod,
    getItemQuantity,
    isProductInCart,
    getCartSummary,
    validateCart,
    refreshCart,
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

// Hook to use cart context
export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

// Cart item component for easy integration
export const CartItemComponent: React.FC<{
  item: CartItem;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
  isLoading?: boolean;
}> = ({ item, onUpdateQuantity, onRemove, isLoading = false }) => {
  const [quantity, setQuantity] = useState(item.quantity);

  const handleQuantityChange = (newQuantity: number) => {
    setQuantity(newQuantity);
    onUpdateQuantity(item.id, newQuantity);
  };

  return (
    <div className="flex items-center space-x-4 py-4 border-b">
      {/* Product Image */}
      <div className="flex-shrink-0">
        <img
          src={item.product.images[0]?.url || '/placeholder-product.jpg'}
          alt={item.product.images[0]?.alt_text || item.product.name}
          className="w-16 h-16 object-cover rounded-md"
        />
      </div>

      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-gray-900 truncate">
          {item.product.name}
        </h3>
        {item.variant && (
          <p className="text-sm text-gray-500">
            {item.variant.options.map(opt => `${opt.name}: ${opt.value}`).join(', ')}
          </p>
        )}
        <p className="text-sm text-gray-500">
          SKU: {item.variant?.sku || item.product.sku}
        </p>
      </div>

      {/* Quantity Controls */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => handleQuantityChange(quantity - 1)}
          disabled={isLoading || quantity <= 1}
          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
        >
          -
        </button>
        <span className="w-8 text-center text-sm font-medium">
          {quantity}
        </span>
        <button
          onClick={() => handleQuantityChange(quantity + 1)}
          disabled={isLoading}
          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
        >
          +
        </button>
      </div>

      {/* Price */}
      <div className="text-right">
        <p className="text-sm font-medium text-gray-900">
          {CartUtils.formatPrice(item.total_price, 'USD')}
        </p>
        {item.discount_amount > 0 && (
          <p className="text-xs text-green-600">
            -{CartUtils.formatPrice(item.discount_amount, 'USD')}
          </p>
        )}
      </div>

      {/* Remove Button */}
      <button
        onClick={() => onRemove(item.id)}
        disabled={isLoading}
        className="text-red-500 hover:text-red-700 disabled:opacity-50"
        aria-label="Remove item"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

export default CartProvider;
