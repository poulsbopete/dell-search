import { NextRequest, NextResponse } from 'next/server'
import { recommendationEngine } from '@/lib/recommendations'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { searchQuery, searchResults, sessionId, action, productId, actionType } = body

    // Handle tracking actions
    if (action === 'track' && sessionId && productId && actionType) {
      recommendationEngine.trackUserBehavior(sessionId, actionType as 'search' | 'view' | 'click', productId)
      return NextResponse.json({ success: true })
    }

    // Handle recommendation generation
    if (!searchQuery || !searchResults || !sessionId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Track the search for future recommendations
    recommendationEngine.trackUserBehavior(sessionId, 'search', searchQuery)

    // Generate recommendations
    const recommendations = await recommendationEngine.generateRecommendations({
      currentSearch: searchQuery,
      searchResults,
      sessionId,
    })

    return NextResponse.json(recommendations)
  } catch (error) {
    console.error('Recommendations API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
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

    const userBehavior = recommendationEngine.getUserBehavior(sessionId)
    
    return NextResponse.json({
      userBehavior,
      sessionId,
    })
  } catch (error) {
    console.error('User behavior API error:', error)
    return NextResponse.json(
      { error: 'Failed to get user behavior' },
      { status: 500 }
    )
  }
}
