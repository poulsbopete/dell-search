'use client'

import { useState, useEffect } from 'react'
import { ProductCard } from './ProductCard'
import { SearchResult } from '@/lib/elastic'

interface Product extends SearchResult {
  name: string
  specifications: Record<string, any>
}

interface RecommendationSection {
  title: string
  products: Product[]
  explanation: string
  icon: string
}

interface SmartRecommendationsProps {
  searchQuery: string
  searchResults: SearchResult[]
  sessionId: string
  onProductClick?: (product: SearchResult) => void
}

export function SmartRecommendations({ 
  searchQuery, 
  searchResults, 
  sessionId, 
  onProductClick 
}: SmartRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<RecommendationSection[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (searchQuery && searchResults.length > 0) {
      generateRecommendations()
    }
  }, [searchQuery, searchResults])

  const generateRecommendations = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          searchQuery,
          searchResults: searchResults.slice(0, 10), // Limit for performance
          sessionId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate recommendations')
      }

      const data = await response.json()
      
      // Transform the response into recommendation sections
      const sections: RecommendationSection[] = [
        {
          title: 'Personalized for You',
          products: data.personalized || [],
          explanation: data.explanations?.[0] || 'Based on your search preferences',
          icon: '🎯'
        },
        {
          title: 'Related Products',
          products: data.related || [],
          explanation: data.explanations?.[1] || 'Products that complement your search',
          icon: '🔗'
        },
        {
          title: 'Trending Now',
          products: data.trending || [],
          explanation: data.explanations?.[2] || 'Popular choices in this category',
          icon: '🔥'
        }
      ]

      setRecommendations(sections)
    } catch (err) {
      console.error('Recommendation error:', err)
      setError('Unable to load recommendations')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Generating smart recommendations...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="text-center py-4">
          <p className="text-gray-500">{error}</p>
          <button 
            onClick={generateRecommendations}
            className="mt-2 text-blue-600 hover:text-blue-800 underline"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  if (recommendations.length === 0) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <div className="bg-blue-100 rounded-full p-2 mr-3">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Smart Recommendations</h2>
        </div>
        <p className="text-gray-600 mb-4">
          AI-powered suggestions tailored to your search and preferences
        </p>
      </div>

      {recommendations.map((section, index) => (
        <div key={index} className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-2xl mr-3">{section.icon}</span>
                <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
              </div>
              <div className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full">
                {section.products.length} products
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-1">{section.explanation}</p>
          </div>
          
          <div className="p-6">
            {section.products.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {section.products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onClick={() => onProductClick?.(product)}
                    showRecommendationBadge={true}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No recommendations available for this section</p>
              </div>
            )}
          </div>
        </div>
      ))}

      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex items-start">
          <div className="bg-blue-100 rounded-full p-2 mr-3 mt-1">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">How Recommendations Work</h4>
            <p className="text-sm text-blue-800">
              Our AI analyzes your search patterns, product preferences, and browsing behavior to provide personalized recommendations. 
              The more you search and interact with products, the better our suggestions become.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
