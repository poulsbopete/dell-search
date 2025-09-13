import { NextRequest, NextResponse } from 'next/server'
import { conversationManager } from '@/lib/conversation'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, message, currentSearch, searchResults } = body

    if (!sessionId || !message) {
      return NextResponse.json(
        { error: 'Session ID and message are required' },
        { status: 400 }
      )
    }

    // Generate intelligent response with full conversation context
    const response = await conversationManager.generateResponse(
      sessionId,
      message,
      currentSearch,
      searchResults
    )

    return NextResponse.json(response)
  } catch (error) {
    console.error('Conversation API error:', error)
    return NextResponse.json(
      { error: 'Failed to process conversation' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      )
    }

    const summary = conversationManager.getConversationSummary(sessionId)
    
    return NextResponse.json({
      summary,
      sessionId,
    })
  } catch (error) {
    console.error('Conversation summary API error:', error)
    return NextResponse.json(
      { error: 'Failed to get conversation summary' },
      { status: 500 }
    )
  }
}
