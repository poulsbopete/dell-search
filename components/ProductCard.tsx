'use client'

import { SearchResult } from '@/lib/elastic'
import { ShoppingCart, Heart, ExternalLink, Star } from 'lucide-react'
import { useState } from 'react'

interface ProductCardProps {
  product: SearchResult
  onClick?: () => void
  showRecommendationBadge?: boolean
}

export function ProductCard({ product, onClick, showRecommendationBadge = false }: ProductCardProps) {
  const [imageLoading, setImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)

  const handleImageLoad = () => {
    setImageLoading(false)
  }

  const handleImageError = () => {
    setImageLoading(false)
    setImageError(true)
  }

  return (
    <div className="product-card relative" onClick={onClick}>
      {showRecommendationBadge && (
        <div className="absolute top-2 right-2 z-10">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center">
            <Star className="h-3 w-3 mr-1" />
            AI Pick
          </div>
        </div>
      )}
      <div className="aspect-w-16 aspect-h-9 bg-gray-200 relative overflow-hidden">
        {product.image && !imageError ? (
          <>
            {imageLoading && (
              <div className="absolute inset-0 bg-gradient-to-br from-dell-lightblue to-dell-blue flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            )}
            <img
              src={product.image}
              alt={product.title}
              className={`w-full h-48 object-cover transition-opacity duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          </>
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-dell-lightblue to-dell-blue flex items-center justify-center">
            <span className="text-white text-lg font-semibold">Dell</span>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
            {product.title}
          </h3>
          <button className="p-1 text-gray-400 hover:text-red-500">
            <Heart className="h-5 w-5" />
          </button>
        </div>
        
        {product.category && (
          <span className="inline-block px-2 py-1 text-xs font-medium text-dell-blue bg-dell-lightblue rounded-full mb-2">
            {product.category}
          </span>
        )}
        
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {product.description}
        </p>
        
        {product.price && (
          <div className="flex items-center justify-between mb-3">
            <div className="text-xl font-bold text-dell-blue">
              {product.price}
            </div>
            {product.rating && (
              <div className="flex items-center text-sm text-gray-600">
                <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                <span>{product.rating}</span>
                {product.reviews && (
                  <span className="ml-1 text-gray-500">({product.reviews})</span>
                )}
              </div>
            )}
          </div>
        )}
        
        <div className="flex space-x-2">
          <button className="flex-1 bg-dell-blue text-white px-4 py-2 rounded-md hover:bg-dell-darkblue focus:outline-none focus:ring-2 focus:ring-dell-blue focus:ring-offset-2 flex items-center justify-center">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add to Cart
          </button>
          {product.url && (
            <button 
              onClick={() => window.open(product.url, '_blank')}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-dell-blue focus:ring-offset-2"
            >
              <ExternalLink className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProductCard
