import OpenAI from 'openai'
import { SearchResult } from './elastic'

interface Product extends SearchResult {
  name: string
  specifications: Record<string, any>
}

interface UserBehavior {
  searchHistory: string[]
  viewedProducts: string[]
  clickedProducts: string[]
  sessionDuration: number
  preferences: {
    priceRange?: [number, number]
    categories?: string[]
    brands?: string[]
  }
}

interface RecommendationContext {
  currentSearch: string
  searchResults: SearchResult[]
  userBehavior?: UserBehavior
  sessionId: string
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export class RecommendationEngine {
  private userSessions: Map<string, UserBehavior> = new Map()

  // Track user behavior for personalization
  trackUserBehavior(sessionId: string, action: 'search' | 'view' | 'click', data: string) {
    if (!this.userSessions.has(sessionId)) {
      this.userSessions.set(sessionId, {
        searchHistory: [],
        viewedProducts: [],
        clickedProducts: [],
        sessionDuration: 0,
        preferences: {}
      })
    }

    const behavior = this.userSessions.get(sessionId)!
    
    switch (action) {
      case 'search':
        behavior.searchHistory.push(data)
        break
      case 'view':
        behavior.viewedProducts.push(data)
        break
      case 'click':
        behavior.clickedProducts.push(data)
        break
    }
  }

  // Generate smart recommendations using AI
  async generateRecommendations(context: RecommendationContext): Promise<{
    personalized: SearchResult[]
    related: SearchResult[]
    trending: SearchResult[]
    explanations: string[]
  }> {
    try {
      const userBehavior = this.userSessions.get(context.sessionId)
      
      // Create a comprehensive prompt for AI recommendations
      const prompt = this.buildRecommendationPrompt(context, userBehavior)
      
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an expert Dell product recommendation AI. Analyze user behavior, search context, and product relationships to provide intelligent recommendations. Focus on practical, helpful suggestions that match user needs."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      })

      const aiResponse = completion.choices[0]?.message?.content || ''
      
      // Parse AI response and generate recommendations
      return this.parseAIRecommendations(aiResponse, context.searchResults)
      
    } catch (error) {
      console.error('Recommendation engine error:', error)
      return this.getFallbackRecommendations(context.searchResults)
    }
  }

  private buildRecommendationPrompt(context: RecommendationContext, userBehavior?: UserBehavior): string {
    const currentProducts = context.searchResults.slice(0, 5).map(p => 
      `${p.title} (${p.category}, ${p.price})`
    ).join(', ')

    let prompt = `Current search: "${context.currentSearch}"
Current results: ${currentProducts}

Generate smart product recommendations for this user. Consider:`

    if (userBehavior) {
      prompt += `
User behavior:
- Search history: ${userBehavior.searchHistory.slice(-5).join(', ')}
- Viewed products: ${userBehavior.viewedProducts.slice(-3).join(', ')}
- Clicked products: ${userBehavior.clickedProducts.slice(-3).join(', ')}`
    }

    prompt += `

Provide recommendations in this format:
PERSONALIZED: [3 products that match user's specific needs and behavior]
RELATED: [3 products that complement the current search]
TRENDING: [3 popular products in similar categories]
EXPLANATIONS: [Brief explanations for each recommendation category]

Focus on Dell products and be specific about why each recommendation makes sense.`

    return prompt
  }

  private parseAIRecommendations(aiResponse: string, availableProducts: SearchResult[]): {
    personalized: SearchResult[]
    related: SearchResult[]
    trending: SearchResult[]
    explanations: string[]
  } {
    // For now, implement a smart fallback that uses the AI response for explanations
    // but generates actual recommendations from available products
    const explanations = this.extractExplanations(aiResponse)
    
    return {
      personalized: this.generatePersonalizedRecommendations(availableProducts),
      related: this.generateRelatedRecommendations(availableProducts),
      trending: this.generateTrendingRecommendations(availableProducts),
      explanations: explanations.length > 0 ? explanations : [
        "Based on your search, here are some personalized recommendations",
        "Products that complement your current search",
        "Popular choices in similar categories"
      ]
    }
  }

  private extractExplanations(aiResponse: string): string[] {
    const explanations: string[] = []
    const lines = aiResponse.split('\n')
    
    for (const line of lines) {
      if (line.includes('EXPLANATIONS:') || line.includes('Explanation:')) {
        const explanation = line.replace(/.*EXPLANATIONS?:\s*/i, '').trim()
        if (explanation) explanations.push(explanation)
      }
    }
    
    return explanations
  }

  private generatePersonalizedRecommendations(products: SearchResult[]): SearchResult[] {
    // Smart algorithm to select personalized recommendations
    return products
      .filter(p => p.rating && p.rating >= 4.0) // High-rated products
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 3)
  }

  private generateRelatedRecommendations(products: SearchResult[]): SearchResult[] {
    // Find products in related categories
    const categorySet = new Set(products.map(p => p.category).filter(Boolean))
    const categories = Array.from(categorySet)
    return products
      .filter(p => categories.includes(p.category))
      .sort((a, b) => {
        const priceA = parseFloat(a.price?.replace(/[^0-9.]/g, '') || '0')
        const priceB = parseFloat(b.price?.replace(/[^0-9.]/g, '') || '0')
        return priceA - priceB
      })
      .slice(0, 3)
  }

  private generateTrendingRecommendations(products: SearchResult[]): SearchResult[] {
    // Simulate trending products (in real implementation, this would use analytics)
    return products
      .filter(p => p.reviews && p.reviews > 10) // Products with many reviews
      .sort((a, b) => (b.reviews || 0) - (a.reviews || 0))
      .slice(0, 3)
  }

  private getFallbackRecommendations(products: SearchResult[]): {
    personalized: SearchResult[]
    related: SearchResult[]
    trending: SearchResult[]
    explanations: string[]
  } {
    return {
      personalized: products.slice(0, 3),
      related: products.slice(3, 6),
      trending: products.slice(6, 9),
      explanations: [
        "Top-rated products based on your search",
        "Related products you might like",
        "Popular choices in this category"
      ]
    }
  }

  // Get user behavior for analytics
  getUserBehavior(sessionId: string): UserBehavior | undefined {
    return this.userSessions.get(sessionId)
  }

  // Clear old sessions (call periodically)
  cleanupOldSessions() {
    // In a real implementation, you'd store this in a database
    // and clean up sessions older than 24 hours
    const now = Date.now()
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours
    
    const entries = Array.from(this.userSessions.entries())
    for (const [sessionId, behavior] of entries) {
      if (now - behavior.sessionDuration > maxAge) {
        this.userSessions.delete(sessionId)
      }
    }
  }
}

// Singleton instance
export const recommendationEngine = new RecommendationEngine()
