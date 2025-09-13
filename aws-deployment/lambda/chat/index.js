const { sendChatMessage } = require('./chat');

// Simple conversation manager for Lambda
class ConversationManager {
  constructor() {
    this.conversations = new Map();
  }

  getConversationContext(sessionId) {
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
      });
    }
    return this.conversations.get(sessionId);
  }

  addMessage(sessionId, role, content, context) {
    const conversation = this.getConversationContext(sessionId);
    conversation.messages.push({
      role,
      content,
      timestamp: new Date(),
      context
    });

    if (role === 'user') {
      conversation.conversationHistory.questionsAsked.push(content);
      if (context?.searchQuery) {
        conversation.conversationHistory.topics.push(context.searchQuery);
      }
      if (context?.productId) {
        conversation.conversationHistory.productsDiscussed.push(context.productId);
      }
    }
  }

  async generateResponse(sessionId, userMessage, currentSearch, searchResults) {
    const conversation = this.getConversationContext(sessionId);
    this.addMessage(sessionId, 'user', userMessage, { searchQuery: currentSearch });

    try {
      // Build context-aware prompt
      const systemPrompt = this.buildSystemPrompt(conversation, currentSearch, searchResults);
      const conversationHistory = this.buildConversationHistory(conversation.messages);
      
      // Use the existing sendChatMessage function with enhanced context
      const enhancedMessage = `${systemPrompt}\n\nConversation History:\n${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}\n\nUser: ${userMessage}`;
      
      const aiResponse = await sendChatMessage(enhancedMessage, []);
      
      // Enhance the response with suggestions and follow-up questions
      const enhancedResponse = this.enhanceResponse(aiResponse.message, conversation, currentSearch, searchResults);
      
      this.addMessage(sessionId, 'assistant', enhancedResponse.message, { searchQuery: currentSearch });
      
      return enhancedResponse;
    } catch (error) {
      console.error('Conversation error:', error);
      return this.getFallbackResponse(conversation, currentSearch);
    }
  }

  buildSystemPrompt(conversation, currentSearch, searchResults) {
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

CURRENT CONTEXT:`;

    if (currentSearch) {
      prompt += `\n- Current search: "${currentSearch}"`;
    }

    if (searchResults && searchResults.length > 0) {
      prompt += `\n- Available products: ${searchResults.slice(0, 5).map(p => p.title).join(', ')}`;
    }

    if (conversation.conversationHistory.topics.length > 0) {
      prompt += `\n- Previous topics discussed: ${conversation.conversationHistory.topics.slice(-3).join(', ')}`;
    }

    if (conversation.conversationHistory.productsDiscussed.length > 0) {
      prompt += `\n- Products previously discussed: ${conversation.conversationHistory.productsDiscussed.slice(-3).join(', ')}`;
    }

    prompt += `\n\nRemember to maintain context from previous messages and build upon the conversation naturally.`;

    return prompt;
  }

  buildConversationHistory(messages) {
    const recentMessages = messages.slice(-10);
    return recentMessages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  }

  enhanceResponse(aiResponse, conversation, currentSearch, searchResults) {
    const suggestions = this.generateContextualSuggestions(aiResponse, conversation, currentSearch);
    const followUpQuestions = this.generateFollowUpQuestions(aiResponse, conversation, currentSearch);
    
    return {
      message: aiResponse,
      suggestions,
      followUpQuestions,
      context: {
        searchQuery: currentSearch,
        conversationLength: conversation.messages.length,
        topicsDiscussed: conversation.conversationHistory.topics.length
      }
    };
  }

  generateContextualSuggestions(aiResponse, conversation, currentSearch) {
    const suggestions = [];
    const response = aiResponse.toLowerCase();
    
    if (response.includes('laptop') || response.includes('notebook')) {
      suggestions.push('Gaming laptops', 'Business laptops', 'Budget laptops');
    }
    
    if (response.includes('desktop') || response.includes('workstation')) {
      suggestions.push('High-performance desktops', 'Budget desktops', 'Gaming desktops');
    }
    
    if (response.includes('server') || response.includes('enterprise')) {
      suggestions.push('PowerEdge servers', 'Storage solutions', 'Networking equipment');
    }
    
    if (response.includes('monitor') || response.includes('display')) {
      suggestions.push('4K monitors', 'Gaming monitors', 'Ultrawide displays');
    }
    
    if (response.includes('accessories') || response.includes('peripherals')) {
      suggestions.push('Keyboards and mice', 'Docking stations', 'Cables and adapters');
    }
    
    if (currentSearch) {
      const search = currentSearch.toLowerCase();
      if (search.includes('gaming')) {
        suggestions.push('Gaming accessories', 'RGB lighting', 'High-refresh monitors');
      }
      if (search.includes('business') || search.includes('office')) {
        suggestions.push('Business software', 'Security solutions', 'Support services');
      }
      if (search.includes('creative') || search.includes('design')) {
        suggestions.push('Color-accurate monitors', 'Stylus pens', 'Graphics tablets');
      }
    }
    
    const uniqueSuggestions = Array.from(new Set(suggestions));
    return uniqueSuggestions.slice(0, 4);
  }

  generateFollowUpQuestions(aiResponse, conversation, currentSearch) {
    const questions = [];
    
    if (conversation.messages.length === 1) {
      questions.push('What will you primarily use this for?', 'What\'s your budget range?');
    }
    
    if (aiResponse.toLowerCase().includes('compare') || aiResponse.toLowerCase().includes('difference')) {
      questions.push('Which specific models should I compare?', 'What features are most important to you?');
    }
    
    if (aiResponse.toLowerCase().includes('price') || aiResponse.toLowerCase().includes('cost')) {
      questions.push('Are you looking for financing options?', 'Would you like to see current deals?');
    }
    
    if (aiResponse.toLowerCase().includes('specification') || aiResponse.toLowerCase().includes('technical')) {
      questions.push('Do you need help understanding any specs?', 'Would you like configuration recommendations?');
    }
    
    if (currentSearch) {
      const search = currentSearch.toLowerCase();
      if (search.includes('laptop')) {
        questions.push('What screen size do you prefer?', 'How important is battery life?');
      }
      if (search.includes('desktop')) {
        questions.push('Do you need a pre-built or custom configuration?', 'What software will you be running?');
      }
      if (search.includes('server')) {
        questions.push('How many users will access this server?', 'What type of data will you be storing?');
      }
    }
    
    const uniqueQuestions = Array.from(new Set(questions));
    return uniqueQuestions.slice(0, 3);
  }

  getFallbackResponse(conversation, currentSearch) {
    const suggestions = currentSearch ? 
      ['Related products', 'Similar options', 'Accessories'] :
      ['Laptops', 'Desktops', 'Monitors', 'Servers'];
    
    const followUpQuestions = [
      'What\'s your primary use case?',
      'What\'s your budget range?',
      'Any specific requirements?'
    ];
    
    return {
      message: 'I\'m here to help you find the perfect Dell products! What are you looking for today?',
      suggestions,
      followUpQuestions,
      context: { searchQuery: currentSearch }
    };
  }
}

const conversationManager = new ConversationManager();

exports.handler = async (event) => {
  console.log('Chat Lambda Event:', JSON.stringify(event, null, 2));

  try {
    const body = JSON.parse(event.body || '{}');
    const path = event.path || event.requestContext?.path || '';
    
    // Handle conversation endpoint
    if (path.includes('/conversation')) {
      const { sessionId, message, currentSearch, searchResults } = body;

      if (!sessionId || !message) {
        return {
          statusCode: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          },
          body: JSON.stringify({ error: 'Session ID and message are required' }),
        };
      }

      const response = await conversationManager.generateResponse(
        sessionId,
        message,
        currentSearch,
        searchResults
      );

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        },
        body: JSON.stringify(response),
      };
    }
    
    // Handle original chat endpoint
    const { message, history = [] } = body;

    if (!message) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        },
        body: JSON.stringify({ error: 'Message is required' }),
      };
    }

    const chatResponse = await sendChatMessage(message, history);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
      body: JSON.stringify(chatResponse),
    };
  } catch (error) {
    console.error('Chat Lambda Error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
    };
  }
};
