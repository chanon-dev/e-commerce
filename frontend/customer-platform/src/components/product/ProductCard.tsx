import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  HeartIcon,
  ShoppingCartIcon,
  EyeIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { useCartStore } from '@/stores/cartStore';
import { useWishlistStore } from '@/stores/wishlistStore';
import { useAuthStore } from '@/stores/authStore';
import { Product } from '@/types/product';
import { formatPrice } from '@/utils/formatters';
import toast from 'react-hot-toast';

interface ProductCardProps {
  product: Product;
  variant?: 'default' | 'compact' | 'featured';
  showQuickActions?: boolean;
}

const ProductCard = ({ 
  product, 
  variant = 'default',
  showQuickActions = true 
}: ProductCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const { addToCart, isLoading: cartLoading } = useCartStore();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlistStore();
  const { isAuthenticated } = useAuthStore();

  const isWishlisted = isInWishlist(product.id);
  const hasDiscount = product.comparePrice && product.comparePrice > product.price;
  const discountPercentage = hasDiscount 
    ? Math.round(((product.comparePrice! - product.price) / product.comparePrice!) * 100)
    : 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      await addToCart({
        productId: product.id,
        quantity: 1,
      });
      toast.success('Added to cart!');
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast.error('Please login to add to wishlist');
      return;
    }

    try {
      if (isWishlisted) {
        await removeFromWishlist(product.id);
        toast.success('Removed from wishlist');
      } else {
        await addToWishlist(product.id);
        toast.success('Added to wishlist');
      }
    } catch (error) {
      toast.error('Failed to update wishlist');
    }
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // TODO: Open quick view modal
    console.log('Quick view:', product.id);
  };

  const cardVariants = {
    default: 'bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden group hover:shadow-lg transition-shadow duration-300',
    compact: 'bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden group hover:shadow-md transition-shadow duration-200',
    featured: 'bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden group hover:shadow-xl transition-shadow duration-300',
  };

  const imageVariants = {
    default: 'aspect-square',
    compact: 'aspect-[4/3]',
    featured: 'aspect-[3/4]',
  };

  return (
    <motion.div
      className={cardVariants[variant]}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Link href={`/products/${product.id}`}>
        <div className="relative">
          {/* Product Image */}
          <div className={`relative ${imageVariants[variant]} overflow-hidden bg-gray-100`}>
            <Image
              src={product.images?.[currentImageIndex]?.url || '/placeholder-product.jpg'}
              alt={product.images?.[currentImageIndex]?.altText || product.name}
              fill
              className={`object-cover transition-opacity duration-300 ${
                imageLoading ? 'opacity-0' : 'opacity-100'
              }`}
              onLoadingComplete={() => setImageLoading(false)}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            
            {/* Loading skeleton */}
            {imageLoading && (
              <div className="absolute inset-0 bg-gray-200 animate-pulse" />
            )}

            {/* Discount badge */}
            {hasDiscount && (
              <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                -{discountPercentage}%
              </div>
            )}

            {/* New badge */}
            {product.isNew && (
              <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
                NEW
              </div>
            )}

            {/* Quick actions overlay */}
            {showQuickActions && (
              <motion.div
                className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center space-x-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: isHovered ? 1 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <motion.button
                  onClick={handleQuickView}
                  className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <EyeIcon className="w-5 h-5 text-gray-700" />
                </motion.button>
                
                <motion.button
                  onClick={handleWishlistToggle}
                  className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isWishlisted ? (
                    <HeartSolidIcon className="w-5 h-5 text-red-500" />
                  ) : (
                    <HeartIcon className="w-5 h-5 text-gray-700" />
                  )}
                </motion.button>
                
                <motion.button
                  onClick={handleAddToCart}
                  disabled={cartLoading}
                  className="p-2 bg-blue-600 text-white rounded-full shadow-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ShoppingCartIcon className="w-5 h-5" />
                </motion.button>
              </motion.div>
            )}

            {/* Image navigation dots */}
            {product.images && product.images.length > 1 && (
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                {product.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setCurrentImageIndex(index);
                    }}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className={`p-4 ${variant === 'compact' ? 'p-3' : ''}`}>
            {/* Brand */}
            {product.brand && (
              <p className="text-sm text-gray-500 mb-1">{product.brand}</p>
            )}

            {/* Product Name */}
            <h3 className={`font-medium text-gray-900 mb-2 line-clamp-2 ${
              variant === 'compact' ? 'text-sm' : 'text-base'
            }`}>
              {product.name}
            </h3>

            {/* Rating */}
            {product.rating && (
              <div className="flex items-center mb-2">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(product.rating!)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-500 ml-1">
                  ({product.reviewCount || 0})
                </span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-center space-x-2">
              <span className={`font-bold text-gray-900 ${
                variant === 'compact' ? 'text-base' : 'text-lg'
              }`}>
                {formatPrice(product.price)}
              </span>
              {hasDiscount && (
                <span className="text-sm text-gray-500 line-through">
                  {formatPrice(product.comparePrice!)}
                </span>
              )}
            </div>

            {/* Stock status */}
            {product.stock !== undefined && (
              <div className="mt-2">
                {product.stock > 0 ? (
                  <span className="text-sm text-green-600">
                    {product.stock < 10 ? `Only ${product.stock} left` : 'In stock'}
                  </span>
                ) : (
                  <span className="text-sm text-red-600">Out of stock</span>
                )}
              </div>
            )}

            {/* Tags */}
            {product.tags && product.tags.length > 0 && variant === 'featured' && (
              <div className="mt-3 flex flex-wrap gap-1">
                {product.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
