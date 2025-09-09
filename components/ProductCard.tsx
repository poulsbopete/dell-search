'use client'

import { SearchResult } from '@/lib/elastic'
import { ShoppingCart, Heart, ExternalLink } from 'lucide-react'

interface ProductCardProps {
  product: SearchResult
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="product-card">
      <div className="aspect-w-16 aspect-h-9 bg-gray-200">
        {product.image ? (
          <img
            src={product.image}
            alt={product.title}
            className="w-full h-48 object-cover"
          />
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
          <div className="text-xl font-bold text-dell-blue mb-3">
            {product.price}
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
