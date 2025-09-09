interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ChatResponse {
  message: string
  suggestions?: string[]
  products?: any[]
}

export async function sendChatMessage(message: string, history: ChatMessage[] = []): Promise<ChatResponse> {
  try {
    const response = await fetch(`${process.env.ELASTIC_1CHAT_URL}/api/chat/converse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `ApiKey ${process.env.ELASTIC_1CHAT_API_KEY}`,
        'kbn-xsrf': 'true'
      },
      body: JSON.stringify({
        input: message
      })
    })

    if (response.ok) {
      const data = await response.json()
      
      // Extract the response message from the 1Chat API structure
      const responseMessage = data.response?.message || data.message || 'I found some information for you.'
      
      // Generate suggestions based on the response content
      const suggestions = generateSuggestionsFromResponse(responseMessage, message)
      
      return {
        message: responseMessage,
        suggestions,
        products: []
      }
    } else {
      throw new Error(`Chat API error: ${response.status}`)
    }
  } catch (error) {
    console.error('Chat API error:', error)
    
    // Enhanced fallback response based on the query
    const lowerMessage = message.toLowerCase()
    let fallbackMessage = 'I can help you find Dell products! '
    let suggestions = ['Search for laptops', 'Find gaming computers', 'Browse monitors', 'Look for accessories']

    if (lowerMessage.includes('laptop')) {
      fallbackMessage += 'For laptops, I recommend checking out our XPS, Inspiron, and Latitude series. '
      suggestions = ['XPS laptops', 'Budget laptops', 'Gaming laptops', 'Business laptops']
    } else if (lowerMessage.includes('desktop')) {
      fallbackMessage += 'For desktops, consider our OptiPlex, Precision, and Alienware series. '
      suggestions = ['OptiPlex desktops', 'Gaming desktops', 'Workstations', 'All-in-one PCs']
    } else if (lowerMessage.includes('monitor')) {
      fallbackMessage += 'We have a great selection of monitors including UltraSharp, gaming, and portable options. '
      suggestions = ['UltraSharp monitors', 'Gaming monitors', '4K monitors', 'Portable monitors']
    } else if (lowerMessage.includes('budget') || lowerMessage.includes('cheap')) {
      fallbackMessage += 'For budget-friendly options, check out our Inspiron series and Dell Outlet for refurbished deals. '
      suggestions = ['Budget laptops', 'Dell Outlet', 'Student discounts', 'Refurbished PCs']
    }

    return {
      message: fallbackMessage + 'Use the search bar to find specific products, or click the chat icon for more detailed assistance.',
      suggestions
    }
  }
}

function generateSuggestionsFromResponse(responseMessage: string, originalQuery: string): string[] {
  const suggestions: string[] = []
  const lowerResponse = responseMessage.toLowerCase()
  const lowerQuery = originalQuery.toLowerCase()

  // Extract product names and categories from the response
  if (lowerResponse.includes('alienware')) {
    suggestions.push('Alienware laptops', 'Alienware desktops', 'Gaming laptops')
  }
  if (lowerResponse.includes('xps')) {
    suggestions.push('XPS laptops', 'XPS desktops', 'Premium laptops')
  }
  if (lowerResponse.includes('inspiron')) {
    suggestions.push('Inspiron laptops', 'Budget laptops', 'Student laptops')
  }
  if (lowerResponse.includes('latitude')) {
    suggestions.push('Latitude laptops', 'Business laptops', 'Professional laptops')
  }
  if (lowerResponse.includes('optiplex')) {
    suggestions.push('OptiPlex desktops', 'Business desktops', 'Office computers')
  }
  if (lowerResponse.includes('precision')) {
    suggestions.push('Precision workstations', 'Professional workstations', 'CAD laptops')
  }
  if (lowerResponse.includes('gaming') || lowerQuery.includes('gaming')) {
    suggestions.push('Gaming laptops', 'Gaming desktops', 'Gaming accessories')
  }
  if (lowerResponse.includes('budget') || lowerQuery.includes('budget')) {
    suggestions.push('Budget laptops', 'Affordable options', 'Student discounts')
  }

  // Add some general suggestions if we don't have many specific ones
  if (suggestions.length < 3) {
    suggestions.push('Compare products', 'View all laptops', 'Check deals')
  }

  return suggestions.slice(0, 4) // Limit to 4 suggestions
}

export async function getChatTools(): Promise<any[]> {
  try {
    const response = await fetch(`${process.env.ELASTIC_1CHAT_URL}/api/chat/tools`, {
      method: 'GET',
      headers: {
        'Authorization': `ApiKey ${process.env.ELASTIC_1CHAT_API_KEY}`,
        'kbn-xsrf': 'true'
      }
    })

    if (response.ok) {
      return await response.json()
    }
  } catch (error) {
    console.error('Chat tools error:', error)
  }
  
  return []
}
