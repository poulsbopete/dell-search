'use client'

import { useState, useEffect } from 'react'
import { Search, MessageCircle, ShoppingCart, Menu, X, Sparkles } from 'lucide-react'
import SearchResults from '@/components/SearchResults'
import ChatInterface from '@/components/ChatInterface'
import ProductCard from '@/components/ProductCard'

interface SearchResult {
  id: string
  title: string
  description: string
  price?: string
  category?: string
  image?: string
  url?: string
  _score: number
}

export default function Home() {
  const [headerSearchQuery, setHeaderSearchQuery] = useState('')
  const [heroSearchQuery, setHeroSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [chatResponse, setChatResponse] = useState<any>(null)

  const handleSearch = async (query: string) => {
    if (!query.trim()) return
    
    setIsSearching(true)
    setChatResponse(null)
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&includeChat=true`)
      const data = await response.json()
      setSearchResults(data.results || [])
      setChatResponse(data.chatResponse)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleHeaderInputChange = async (value: string) => {
    setHeaderSearchQuery(value)
    
    if (value.length > 2) {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(value)}&type=suggestions`)
        const data = await response.json()
        setSuggestions(data.suggestions || [])
      } catch (error) {
        console.error('Suggestions error:', error)
      }
    } else {
      setSuggestions([])
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setHeaderSearchQuery(suggestion)
    setSuggestions([])
    handleSearch(suggestion)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-dell-blue">Dell</h1>
              </div>
              <div className="hidden md:block ml-8">
                <nav className="flex space-x-8">
                  <a href="#" className="text-gray-700 hover:text-dell-blue px-3 py-2 text-sm font-medium">Laptops</a>
                  <a href="#" className="text-gray-700 hover:text-dell-blue px-3 py-2 text-sm font-medium">Desktops</a>
                  <a href="#" className="text-gray-700 hover:text-dell-blue px-3 py-2 text-sm font-medium">Monitors</a>
                  <a href="#" className="text-gray-700 hover:text-dell-blue px-3 py-2 text-sm font-medium">Gaming</a>
                  <a href="#" className="text-gray-700 hover:text-dell-blue px-3 py-2 text-sm font-medium">Accessories</a>
                </nav>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-lg mx-8 relative">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-dell-blue focus:border-dell-blue sm:text-sm"
                  placeholder="Search Dell products..."
                  value={headerSearchQuery}
                  onChange={(e) => handleHeaderInputChange(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch(headerSearchQuery)}
                />
                {suggestions.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                    {suggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-dell-lightblue"
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        <span className="font-normal block truncate">{suggestion}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowChat(!showChat)}
                className="relative p-2 text-gray-400 hover:text-dell-blue focus:outline-none focus:ring-2 focus:ring-dell-blue focus:ring-offset-2 rounded-md"
              >
                <MessageCircle className="h-6 w-6" />
                {showChat && <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full"></div>}
              </button>
              <button className="relative p-2 text-gray-400 hover:text-dell-blue focus:outline-none focus:ring-2 focus:ring-dell-blue focus:ring-offset-2 rounded-md">
                <ShoppingCart className="h-6 w-6" />
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-dell-blue text-white text-xs rounded-full flex items-center justify-center">0</span>
              </button>
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden p-2 text-gray-400 hover:text-dell-blue focus:outline-none focus:ring-2 focus:ring-dell-blue focus:ring-offset-2 rounded-md"
              >
                {showMobileMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="gradient-bg text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="h-8 w-8 mr-2" />
            <h1 className="text-4xl md:text-6xl font-bold">Next-Gen Dell Experience</h1>
          </div>
          <p className="text-xl md:text-2xl mb-8 text-blue-100">
            Powered by Elastic Search & AI Chat
          </p>
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-6 w-6 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-12 pr-4 py-4 text-lg border-0 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-dell-blue"
                placeholder="Search for laptops, desktops, monitors..."
                value={heroSearchQuery}
                onChange={(e) => setHeroSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch(heroSearchQuery)}
              />
              <button
                onClick={() => handleSearch(heroSearchQuery)}
                className="absolute right-2 top-2 bottom-2 px-6 bg-dell-blue text-white rounded-md hover:bg-dell-darkblue focus:outline-none focus:ring-2 focus:ring-white"
              >
                Search
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {searchResults.length > 0 ? (
          <SearchResults 
            results={searchResults} 
            isSearching={isSearching} 
            chatResponse={chatResponse}
            onSearch={handleSearch}
          />
        ) : (
          <div className="text-center py-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Discover Dell Products</h2>
            <p className="text-lg text-gray-600 mb-8">
              Use the search bar above to find laptops, desktops, monitors, and more
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">AI-Powered Search</h3>
                <p className="text-gray-600">Find exactly what you need with intelligent search powered by Elastic</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Chat Assistant</h3>
                <p className="text-gray-600">Get personalized recommendations and answers to your questions</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Real-time Results</h3>
                <p className="text-gray-600">Instant search results with live product information and pricing</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Chat Interface */}
      {showChat && (
        <div className="fixed bottom-4 right-4 w-96 h-96 bg-white rounded-lg shadow-xl border z-50">
          <ChatInterface onClose={() => setShowChat(false)} />
        </div>
      )}
    </div>
  )
}
