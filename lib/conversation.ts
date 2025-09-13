import OpenAI from 'openai'

interface ConversationMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  context?: {
    searchQuery?: string
    productId?: string
    category?: string
    userIntent?: string
  }
}

interface ConversationContext {
  sessionId: string
  messages: ConversationMessage[]
  currentSearch?: string
  userPreferences: {
    priceRange?: [number, number]
    categories?: string[]
    brands?: string[]
    useCase?: string
  }
  conversationHistory: {
    topics: string[]
    productsDiscussed: string[]
    questionsAsked: string[]
  }
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export class ConversationManager {
  private conversations: Map<string, ConversationContext> = new Map()

  // Initialize or get conversation context
  getConversationContext(sessionId: string): ConversationContext {
    if (!this.conversations.has(sessionId)) {
      this.conversations.set(sessionId, {
        sessionId,
        messages: [],
        userPreferences: {},
        conversationHistory: {
          topics: [],
          productsDiscussed: [],
          questionsAsked: []
        }
      })
    }
    return this.conversations.get(sessionId)!
  }

  // Add message to conversation
  addMessage(sessionId: string, role: 'user' | 'assistant', content: string, context?: any) {
    const conversation = this.getConversationContext(sessionId)
    conversation.messages.push({
      role,
      content,
      timestamp: new Date(),
      context
    })

    // Update conversation history
    if (role === 'user') {
      conversation.conversationHistory.questionsAsked.push(content)
      if (context?.searchQuery) {
        conversation.conversationHistory.topics.push(context.searchQuery)
      }
      if (context?.productId) {
        conversation.conversationHistory.productsDiscussed.push(context.productId)
      }
    }
  }

  // Generate intelligent response with full context
  async generateResponse(
    sessionId: string, 
    userMessage: string, 
    currentSearch?: string,
    searchResults?: any[]
  ): Promise<{
    message: string
    suggestions: string[]
    followUpQuestions: string[]
    context: any
  }> {
    const conversation = this.getConversationContext(sessionId)
    
    // Add user message to conversation
    this.addMessage(sessionId, 'user', userMessage, { searchQuery: currentSearch })

    try {
      // Build comprehensive context for AI
      const systemPrompt = this.buildSystemPrompt(conversation, currentSearch, searchResults)
      const conversationHistory = this.buildConversationHistory(conversation.messages)
      
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          ...conversationHistory,
          { role: "user", content: userMessage }
        ],
        max_tokens: 800,
        temperature: 0.7,
      })

      const aiResponse = completion.choices[0]?.message?.content || 'I\'m here to help you find the perfect Dell products!'
      
      // Parse and enhance the response
      const enhancedResponse = await this.enhanceResponse(aiResponse, conversation, currentSearch, searchResults)
      
      // Add AI response to conversation
      this.addMessage(sessionId, 'assistant', enhancedResponse.message, { searchQuery: currentSearch })
      
      return enhancedResponse
      
    } catch (error) {
      console.error('Conversation AI error:', error)
      return this.getFallbackResponse(conversation, currentSearch)
    }
  }

  private buildSystemPrompt(conversation: ConversationContext, currentSearch?: string, searchResults?: any[]): string {
    let prompt = `You are an expert Dell product consultant and conversational AI assistant. You help users find the perfect Dell products through natural, engaging conversations.

CORE CAPABILITIES:
- Provide detailed product recommendations based on user needs
- Answer technical questions about Dell products
- Compare products and explain differences
- Suggest complementary products and accessories
- Help with configuration and customization options
- Provide pricing guidance and deal information

CONVERSATION STYLE:
- Be conversational, friendly, and helpful
- Ask clarifying questions when needed
- Provide specific, actionable advice
- Use natural language, not robotic responses
- Show enthusiasm for technology and Dell products
- Be honest about limitations and alternatives

CURRENT CONTEXT:`

    if (currentSearch) {
      prompt += `\n- Current search: "${currentSearch}"`
    }

    if (searchResults && searchResults.length > 0) {
      prompt += `\n- Available products: ${searchResults.slice(0, 5).map(p => p.title).join(', ')}`
    }

    if (conversation.conversationHistory.topics.length > 0) {
      prompt += `\n- Previous topics discussed: ${conversation.conversationHistory.topics.slice(-3).join(', ')}`
    }

    if (conversation.conversationHistory.productsDiscussed.length > 0) {
      prompt += `\n- Products previously discussed: ${conversation.conversationHistory.productsDiscussed.slice(-3).join(', ')}`
    }

    if (conversation.userPreferences.useCase) {
      prompt += `\n- User's use case: ${conversation.userPreferences.useCase}`
    }

    prompt += `\n\nRemember to maintain context from previous messages and build upon the conversation naturally.`

    return prompt
  }

  private buildConversationHistory(messages: ConversationMessage[]): Array<{role: 'user' | 'assistant' | 'system', content: string}> {
    // Keep last 10 messages for context (to stay within token limits)
    const recentMessages = messages.slice(-10)
    
    return recentMessages.map(msg => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content
    }))
  }

  private async enhanceResponse(
    aiResponse: string, 
    conversation: ConversationContext, 
    currentSearch?: string,
    searchResults?: any[]
  ): Promise<{
    message: string
    suggestions: string[]
    followUpQuestions: string[]
    context: any
  }> {
    // Generate contextual suggestions based on the response
    const suggestions = this.generateContextualSuggestions(aiResponse, conversation, currentSearch)
    
    // Generate intelligent follow-up questions
    const followUpQuestions = this.generateFollowUpQuestions(aiResponse, conversation, currentSearch)
    
    return {
      message: aiResponse,
      suggestions,
      followUpQuestions,
      context: {
        searchQuery: currentSearch,
        conversationLength: conversation.messages.length,
        topicsDiscussed: conversation.conversationHistory.topics.length
      }
    }
  }

  private generateContextualSuggestions(
    aiResponse: string, 
    conversation: ConversationContext, 
    currentSearch?: string
  ): string[] {
    const suggestions: string[] = []
    
    // Analyze response content to generate relevant suggestions
    const response = aiResponse.toLowerCase()
    
    if (response.includes('laptop') || response.includes('notebook')) {
      suggestions.push('Gaming laptops', 'Business laptops', 'Budget laptops')
    }
    
    if (response.includes('desktop') || response.includes('workstation')) {
      suggestions.push('High-performance desktops', 'Budget desktops', 'Gaming desktops')
    }
    
    if (response.includes('server') || response.includes('enterprise')) {
      suggestions.push('PowerEdge servers', 'Storage solutions', 'Networking equipment')
    }
    
    if (response.includes('monitor') || response.includes('display')) {
      suggestions.push('4K monitors', 'Gaming monitors', 'Ultrawide displays')
    }
    
    if (response.includes('accessories') || response.includes('peripherals')) {
      suggestions.push('Keyboards and mice', 'Docking stations', 'Cables and adapters')
    }
    
    // Add context-specific suggestions
    if (currentSearch) {
      const search = currentSearch.toLowerCase()
      if (search.includes('gaming')) {
        suggestions.push('Gaming accessories', 'RGB lighting', 'High-refresh monitors')
      }
      if (search.includes('business') || search.includes('office')) {
        suggestions.push('Business software', 'Security solutions', 'Support services')
      }
      if (search.includes('creative') || search.includes('design')) {
        suggestions.push('Color-accurate monitors', 'Stylus pens', 'Graphics tablets')
      }
    }
    
    // Remove duplicates and limit to 4 suggestions
    const uniqueSuggestions = Array.from(new Set(suggestions))
    return uniqueSuggestions.slice(0, 4)
  }

  private generateFollowUpQuestions(
    aiResponse: string, 
    conversation: ConversationContext, 
    currentSearch?: string
  ): string[] {
    const questions: string[] = []
    
    // Generate intelligent follow-up questions based on context
    if (conversation.messages.length === 1) {
      // First interaction - ask about use case
      questions.push('What will you primarily use this for?', 'What\'s your budget range?')
    }
    
    if (aiResponse.toLowerCase().includes('compare') || aiResponse.toLowerCase().includes('difference')) {
      questions.push('Which specific models should I compare?', 'What features are most important to you?')
    }
    
    if (aiResponse.toLowerCase().includes('price') || aiResponse.toLowerCase().includes('cost')) {
      questions.push('Are you looking for financing options?', 'Would you like to see current deals?')
    }
    
    if (aiResponse.toLowerCase().includes('specification') || aiResponse.toLowerCase().includes('technical')) {
      questions.push('Do you need help understanding any specs?', 'Would you like configuration recommendations?')
    }
    
    // Context-aware questions
    if (currentSearch) {
      const search = currentSearch.toLowerCase()
      if (search.includes('laptop')) {
        questions.push('What screen size do you prefer?', 'How important is battery life?')
      }
      if (search.includes('desktop')) {
        questions.push('Do you need a pre-built or custom configuration?', 'What software will you be running?')
      }
      if (search.includes('server')) {
        questions.push('How many users will access this server?', 'What type of data will you be storing?')
      }
    }
    
    // Remove duplicates and limit to 3 questions
    const uniqueQuestions = Array.from(new Set(questions))
    return uniqueQuestions.slice(0, 3)
  }

  private getFallbackResponse(conversation: ConversationContext, currentSearch?: string): {
    message: string
    suggestions: string[]
    followUpQuestions: string[]
    context: any
  } {
    const suggestions = currentSearch ? 
      ['Related products', 'Similar options', 'Accessories'] :
      ['Laptops', 'Desktops', 'Monitors', 'Servers']
    
    const followUpQuestions = [
      'What\'s your primary use case?',
      'What\'s your budget range?',
      'Any specific requirements?'
    ]
    
    return {
      message: 'I\'m here to help you find the perfect Dell products! What are you looking for today?',
      suggestions,
      followUpQuestions,
      context: { searchQuery: currentSearch }
    }
  }

  // Update user preferences based on conversation
  updateUserPreferences(sessionId: string, preferences: Partial<ConversationContext['userPreferences']>) {
    const conversation = this.getConversationContext(sessionId)
    conversation.userPreferences = { ...conversation.userPreferences, ...preferences }
  }

  // Get conversation summary
  getConversationSummary(sessionId: string): {
    messageCount: number
    topics: string[]
    productsDiscussed: string[]
    duration: number
  } {
    const conversation = this.getConversationContext(sessionId)
    const firstMessage = conversation.messages[0]
    const lastMessage = conversation.messages[conversation.messages.length - 1]
    
    return {
      messageCount: conversation.messages.length,
      topics: conversation.conversationHistory.topics,
      productsDiscussed: conversation.conversationHistory.productsDiscussed,
      duration: firstMessage && lastMessage ? 
        lastMessage.timestamp.getTime() - firstMessage.timestamp.getTime() : 0
    }
  }

  // Clean up old conversations
  cleanupOldConversations() {
    const now = Date.now()
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours
    
    const entries = Array.from(this.conversations.entries())
    for (const [sessionId, conversation] of entries) {
      const lastMessage = conversation.messages[conversation.messages.length - 1]
      if (lastMessage && now - lastMessage.timestamp.getTime() > maxAge) {
        this.conversations.delete(sessionId)
      }
    }
  }
}

// Singleton instance
export const conversationManager = new ConversationManager()
