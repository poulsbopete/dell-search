import { NextRequest, NextResponse } from 'next/server'
import { searchProducts, getSuggestions } from '@/lib/elastic'
import { sendChatMessage } from '@/lib/chat'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  const type = searchParams.get('type') || 'products'
  const size = parseInt(searchParams.get('size') || '10')
  const includeChat = searchParams.get('includeChat') === 'true'

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
  }

  try {
    if (type === 'suggestions') {
      const suggestions = await getSuggestions(query)
      return NextResponse.json({ suggestions })
    } else {
      // Get search results
      const results = await searchProducts(query, size)
      
      // Get chat response if requested
      let chatResponse = null
      if (includeChat) {
        try {
          chatResponse = await sendChatMessage(query)
        } catch (error) {
          console.error('Chat error in search:', error)
          // Continue without chat response
        }
      }
      
      return NextResponse.json({ 
        results,
        total: results.length,
        query,
        chatResponse
      })
    }
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json(
      { error: 'Search failed' }, 
      { status: 500 }
    )
  }
}
