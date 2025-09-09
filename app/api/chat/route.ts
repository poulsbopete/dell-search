import { NextRequest, NextResponse } from 'next/server'
import { sendChatMessage } from '@/lib/chat'

export async function POST(request: NextRequest) {
  try {
    const { message, history = [] } = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const response = await sendChatMessage(message, history)
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Chat failed' }, 
      { status: 500 }
    )
  }
}
