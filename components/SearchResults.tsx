'use client'

import { useState } from 'react'
import { SearchResult } from '@/lib/elastic'
import ProductCard from './ProductCard'

interface SearchResultsProps {
  results: SearchResult[]
  isSearching: boolean
  chatResponse?: any
  onSearch?: (query: string) => void
}

export default function SearchResults({ results, isSearching, chatResponse, onSearch }: SearchResultsProps) {
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [currentChatResponse, setCurrentChatResponse] = useState(chatResponse)

  const formatChatResponse = (message: string) => {
    if (!message) return null

    // Split the message into lines and process each one
    const lines = message.split('\n')
    const elements: JSX.Element[] = []
    let key = 0

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      if (!line) {
        elements.push(<br key={key++} />)
        continue
      }

      // Handle headers
      if (line.startsWith('# ')) {
        elements.push(
          <h1 key={key++} className="text-xl font-bold text-dell-blue mb-3 mt-4">
            {line.substring(2)}
          </h1>
        )
      } else if (line.startsWith('## ')) {
        elements.push(
          <h2 key={key++} className="text-lg font-semibold text-gray-800 mb-2 mt-3">
            {line.substring(3)}
          </h2>
        )
      } else if (line.startsWith('### ')) {
        elements.push(
          <h3 key={key++} className="text-base font-medium text-gray-700 mb-2 mt-2">
            {line.substring(4)}
          </h3>
        )
      } else if (line.startsWith('- **') && line.includes('**:')) {
        // Handle bullet points with bold labels
        const content = line.substring(2) // Remove the "- "
        const parts = content.split('**:')
        if (parts.length === 2) {
          elements.push(
            <div key={key++} className="ml-4 mb-2">
              <span className="font-semibold text-gray-800">{parts[0].substring(2)}</span>
              <span className="text-gray-700">{parts[1]}</span>
            </div>
          )
        } else {
          elements.push(
            <div key={key++} className="ml-4 mb-2 text-gray-700">
              {content}
            </div>
          )
        }
      } else if (line.startsWith('- ')) {
        // Handle regular bullet points
        elements.push(
          <div key={key++} className="ml-4 mb-2 text-gray-700">
            {line.substring(2)}
          </div>
        )
      } else if (line.startsWith('**') && line.endsWith('**')) {
        // Handle bold text
        elements.push(
          <div key={key++} className="font-semibold text-gray-800 mb-2">
            {line.substring(2, line.length - 2)}
          </div>
        )
      } else {
        // Handle regular paragraphs
        const formattedLine = line
          .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-800">$1</strong>')
          .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
        
        elements.push(
          <p 
            key={key++} 
            className="mb-3 text-gray-700 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: formattedLine }}
          />
        )
      }
    }

    return <div>{elements}</div>
  }

  const handleFollowUpQuery = async (query: string) => {
    setIsChatLoading(true)
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&includeChat=true`)
      const data = await response.json()
      setCurrentChatResponse(data.chatResponse)
    } catch (error) {
      console.error('Follow-up error:', error)
    } finally {
      setIsChatLoading(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    if (onSearch) {
      onSearch(suggestion)
    }
  }

  if (isSearching) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dell-blue"></div>
        <span className="ml-3 text-lg text-gray-600">Searching...</span>
      </div>
    )
  }

  if (results.length === 0 && !currentChatResponse) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">No results found</h2>
        <p className="text-gray-600">Try adjusting your search terms or browse our categories</p>
      </div>
    )
  }

  return (
    <div>
      {/* Interactive AI Assistant Response Section */}
      {currentChatResponse && (
        <div className="mb-8 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-dell-blue to-dell-darkblue px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-white rounded-full flex items-center justify-center mr-3">
                  <svg className="h-4 w-4 text-dell-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white">AI Assistant Response</h3>
              </div>
              <button 
                onClick={() => window.open('/chat', '_blank')}
                className="text-sm text-white hover:text-blue-200 underline transition-colors"
              >
                Open Full Chat
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="prose prose-sm max-w-none" data-chat-response>
              {isChatLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-dell-blue mr-2"></div>
                  <span className="text-gray-600">AI is thinking...</span>
                </div>
              ) : (
                <div className="text-gray-700 leading-relaxed">
                  {formatChatResponse(currentChatResponse.message)}
                </div>
              )}
              
              {currentChatResponse.suggestions && currentChatResponse.suggestions.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Suggested searches:</h4>
                  <div className="flex flex-wrap gap-2">
                    {currentChatResponse.suggestions.map((suggestion: string, index: number) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="px-4 py-2 bg-gray-50 text-dell-blue text-sm rounded-lg border border-gray-200 hover:bg-dell-blue hover:text-white hover:border-dell-blue transition-all duration-200 cursor-pointer font-medium"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Interactive Follow-up Questions */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Ask me more:</h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleFollowUpQuery("What are the best features of this product?")}
                    disabled={isChatLoading}
                    className="px-4 py-2 bg-dell-blue text-white text-sm rounded-lg hover:bg-dell-darkblue transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    Tell me more
                  </button>
                  <button
                    onClick={() => handleFollowUpQuery("What are the pricing options?")}
                    disabled={isChatLoading}
                    className="px-4 py-2 bg-dell-blue text-white text-sm rounded-lg hover:bg-dell-darkblue transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    Pricing info
                  </button>
                  <button
                    onClick={() => handleFollowUpQuery("Compare with similar products")}
                    disabled={isChatLoading}
                    className="px-4 py-2 bg-dell-blue text-white text-sm rounded-lg hover:bg-dell-darkblue transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    Compare products
                  </button>
                  <button
                    onClick={() => handleFollowUpQuery("What are the technical specifications?")}
                    disabled={isChatLoading}
                    className="px-4 py-2 bg-dell-blue text-white text-sm rounded-lg hover:bg-dell-darkblue transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    Tech specs
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Search Results ({results.length})
        </h2>
        <div className="flex space-x-2">
          <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
            Sort by Relevance
          </button>
          <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
            Sort by Price
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {results.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {results.length >= 10 && (
        <div className="text-center mt-8">
          <button className="px-6 py-3 bg-dell-blue text-white rounded-md hover:bg-dell-darkblue focus:outline-none focus:ring-2 focus:ring-dell-blue focus:ring-offset-2">
            Load More Results
          </button>
        </div>
      )}
    </div>
  )
}