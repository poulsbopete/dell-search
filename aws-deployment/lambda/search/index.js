const { searchProducts, getSuggestions } = require('./elastic');
const { sendChatMessage } = require('./chat');

exports.handler = async (event) => {
  console.log('Search Lambda Event:', JSON.stringify(event, null, 2));

  try {
    const { queryStringParameters } = event;
    const query = queryStringParameters?.q || '';
    const includeChat = queryStringParameters?.includeChat === 'true';
    const type = queryStringParameters?.type;

    if (!query) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        },
        body: JSON.stringify({ error: 'Query parameter is required' }),
      };
    }

    let results = [];
    let suggestions = [];
    let chatResponse = null;

    if (type === 'suggestions') {
      // Get search suggestions
      suggestions = await getSuggestions(query);
    } else {
      // Perform product search
      results = await searchProducts(query);
      
      // Get chat response if requested
      if (includeChat) {
        try {
          chatResponse = await sendChatMessage(query);
        } catch (error) {
          console.error('Chat API error:', error);
          // Continue without chat response
        }
      }
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
      body: JSON.stringify({
        results,
        suggestions,
        chatResponse,
        query,
      }),
    };
  } catch (error) {
    console.error('Search Lambda Error:', error);
    
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
