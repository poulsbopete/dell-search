import OpenAI from 'openai'

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

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function sendChatMessage(message: string, history: ChatMessage[] = []): Promise<ChatResponse> {
  try {
    // Convert history to OpenAI format
    const openaiHistory = history.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    }))

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful Dell product assistant. Help users find the right Dell products including laptops, desktops, monitors, and accessories. Provide helpful recommendations and answer questions about Dell products. Keep responses concise and helpful."
        },
        ...openaiHistory,
        {
          role: "user",
          content: message
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
    })

    const responseMessage = completion.choices[0]?.message?.content || 'I found some information for you.'
    
    // Generate suggestions based on the response content
    const suggestions = generateSuggestionsFromResponse(responseMessage, message)
    
    return {
      message: responseMessage,
      suggestions,
      products: []
    }
  } catch (error) {
    console.error('OpenAI API error:', error)
    
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

