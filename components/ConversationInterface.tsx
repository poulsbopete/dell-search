'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, MessageCircle, Bot, User, Sparkles, Lightbulb } from 'lucide-react'

interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  suggestions?: string[]
  followUpQuestions?: string[]
}

interface ConversationInterfaceProps {
  sessionId: string
  currentSearch?: string
  searchResults?: any[]
  onSuggestionClick?: (suggestion: string) => void
  onFollowUpClick?: (question: string) => void
}

// Helper functions for generating suggestions and follow-up questions
function generateSuggestionsFromResponse(aiResponse: string, userMessage: string): string[] {
  const suggestions: string[] = []
  const response = aiResponse.toLowerCase()
  const message = userMessage.toLowerCase()
  
  if (response.includes('laptop') || message.includes('laptop')) {
    suggestions.push('Gaming laptops', 'Business laptops', 'Budget laptops')
  }
  
  if (response.includes('desktop') || message.includes('desktop')) {
    suggestions.push('High-performance desktops', 'Budget desktops', 'Gaming desktops')
  }
  
  if (response.includes('server') || message.includes('server') || message.includes('jellyfin')) {
    suggestions.push('PowerEdge servers', 'Storage solutions', 'Home NAS solutions')
  }
  
  if (response.includes('monitor') || message.includes('monitor')) {
    suggestions.push('4K monitors', 'Gaming monitors', 'Ultrawide displays')
  }
  
  if (response.includes('accessories') || message.includes('accessories')) {
    suggestions.push('Keyboards and mice', 'Docking stations', 'Cables and adapters')
  }
  
  // Default suggestions if none match
  if (suggestions.length === 0) {
    suggestions.push('Related products', 'Similar options', 'Accessories')
  }
  
  return suggestions.slice(0, 4)
}

function generateFollowUpQuestions(aiResponse: string, userMessage: string): string[] {
  const questions: string[] = []
  const response = aiResponse.toLowerCase()
  const message = userMessage.toLowerCase()
  
  if (response.includes('compare') || response.includes('difference')) {
    questions.push('Which specific models should I compare?', 'What features are most important to you?')
  }
  
  if (response.includes('price') || response.includes('cost')) {
    questions.push('Are you looking for financing options?', 'Would you like to see current deals?')
  }
  
  if (response.includes('specification') || response.includes('technical')) {
    questions.push('Do you need help understanding any specs?', 'Would you like configuration recommendations?')
  }
  
  if (message.includes('jellyfin') || message.includes('media server')) {
    questions.push('How many users will access this server?', 'What type of media will you be storing?')
  }
  
  // Default questions if none match
  if (questions.length === 0) {
    questions.push('What\'s your primary use case?', 'What\'s your budget range?', 'Any specific requirements?')
  }
  
  return questions.slice(0, 3)
}

export function ConversationInterface({ 
  sessionId, 
  currentSearch, 
  searchResults,
  onSuggestionClick,
  onFollowUpClick 
}: ConversationInterfaceProps) {
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return

    const userMessage: ConversationMessage = {
      role: 'user',
      content: message,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://1c4i2e9ym1.execute-api.us-east-1.amazonaws.com/prod'}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `[CONVERSATION] Session: ${sessionId}, Search: ${currentSearch || 'none'}, Products: ${searchResults?.slice(0, 5).map(p => p.title).join(', ') || 'none'}\n\nUser: ${message}`,
          history: messages.slice(-5).map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()
      
      // Generate suggestions and follow-up questions based on the response
      const suggestions = generateSuggestionsFromResponse(data.message, message)
      const followUpQuestions = generateFollowUpQuestions(data.message, message)
      
      const assistantMessage: ConversationMessage = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
        suggestions,
        followUpQuestions
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Conversation error:', error)
      const errorMessage: ConversationMessage = {
        role: 'assistant',
        content: 'I apologize, but I\'m having trouble responding right now. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    if (onSuggestionClick) {
      onSuggestionClick(suggestion)
    }
    sendMessage(`Tell me more about ${suggestion}`)
  }

  const handleFollowUpClick = (question: string) => {
    if (onFollowUpClick) {
      onFollowUpClick(question)
    }
    sendMessage(question)
  }

  const formatMessage = (content: string) => {
    // Simple formatting for better readability
    return content.split('\n').map((line, index) => (
      <p key={index} className="mb-2 last:mb-0">
        {line}
      </p>
    ))
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div 
        className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="bg-white/20 rounded-full p-2 mr-3">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">AI Conversation</h3>
              <p className="text-blue-100 text-sm">
                {messages.length > 0 ? `${messages.length} messages` : 'Start a conversation'}
              </p>
            </div>
          </div>
          <div className="flex items-center">
            {messages.length > 0 && (
              <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full mr-2">
                {messages.filter(m => m.role === 'user').length} questions
              </span>
            )}
            <div className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Conversation Area */}
      {isExpanded && (
        <div className="h-96 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">Start a Conversation</h4>
                <p className="text-gray-600 mb-4">
                  Ask me anything about Dell products, get recommendations, or compare options!
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <button
                    onClick={() => sendMessage("What Dell laptop would you recommend for gaming?")}
                    className="px-4 py-2 bg-blue-50 text-blue-600 text-sm rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    Gaming laptop recommendations
                  </button>
                  <button
                    onClick={() => sendMessage("Help me choose a desktop for video editing")}
                    className="px-4 py-2 bg-blue-50 text-blue-600 text-sm rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    Video editing desktop
                  </button>
                  <button
                    onClick={() => sendMessage("What's the difference between OptiPlex and Precision?")}
                    className="px-4 py-2 bg-blue-50 text-blue-600 text-sm rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    Compare product lines
                  </button>
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex max-w-xs lg:max-w-md ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`flex-shrink-0 ${message.role === 'user' ? 'ml-3' : 'mr-3'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        message.role === 'user' 
                          ? 'bg-blue-600' 
                          : 'bg-gradient-to-r from-purple-500 to-pink-500'
                      }`}>
                        {message.role === 'user' ? (
                          <User className="w-4 h-4 text-white" />
                        ) : (
                          <Bot className="w-4 h-4 text-white" />
                        )}
                      </div>
                    </div>
                    <div className={`rounded-lg px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <div className="text-sm">
                        {formatMessage(message.content)}
                      </div>
                      
                      {/* Suggestions */}
                      {message.suggestions && message.suggestions.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="flex flex-wrap gap-1">
                            {message.suggestions.map((suggestion, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleSuggestionClick(suggestion)}
                                className="px-2 py-1 bg-white/20 text-xs rounded hover:bg-white/30 transition-colors"
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Follow-up Questions */}
                      {message.followUpQuestions && message.followUpQuestions.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="flex flex-wrap gap-1">
                            {message.followUpQuestions.map((question, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleFollowUpClick(question)}
                                className="px-2 py-1 bg-blue-500/20 text-blue-700 text-xs rounded hover:bg-blue-500/30 transition-colors"
                              >
                                {question}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex max-w-xs lg:max-w-md">
                  <div className="flex-shrink-0 mr-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="bg-gray-100 rounded-lg px-4 py-2">
                    <div className="flex items-center space-x-1">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600"></div>
                      <span className="text-sm text-gray-600">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage(inputMessage)}
                placeholder="Ask me anything about Dell products..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
              <button
                onClick={() => sendMessage(inputMessage)}
                disabled={!inputMessage.trim() || isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
