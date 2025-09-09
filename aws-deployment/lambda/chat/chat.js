const https = require('https');
const http = require('http');

async function sendChatMessage(message, history = []) {
  try {
    const url = new URL(`${process.env.ELASTIC_1CHAT_URL}/api/chat/converse`);
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `ApiKey ${process.env.ELASTIC_1CHAT_API_KEY}`,
        'kbn-xsrf': 'true'
      },
    };

    const body = JSON.stringify({
      input: message
    });

    options.headers['Content-Length'] = Buffer.byteLength(body);

    return new Promise((resolve, reject) => {
      const client = url.protocol === 'https:' ? https : http;
      
      const req = client.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              const parsedData = JSON.parse(data);
              const responseMessage = parsedData.response?.message || parsedData.message || 'I found some information for you.';
              const suggestions = generateSuggestionsFromResponse(responseMessage, message);
              
              resolve({
                message: responseMessage,
                suggestions,
                products: []
              });
            } else {
              throw new Error(`Chat API error: ${res.statusCode}`);
            }
          } catch (error) {
            console.error('Chat API error:', error);
            resolve(getFallbackResponse(message));
          }
        });
      });

      req.on('error', (error) => {
        console.error('Chat API error:', error);
        resolve(getFallbackResponse(message));
      });

      req.write(body);
      req.end();
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return getFallbackResponse(message);
  }
}

function generateSuggestionsFromResponse(responseMessage, originalQuery) {
  const suggestions = [];
  const lowerResponse = responseMessage.toLowerCase();
  const lowerQuery = originalQuery.toLowerCase();

  // Extract product names and categories from the response
  if (lowerResponse.includes('alienware')) {
    suggestions.push('Alienware laptops', 'Alienware desktops', 'Gaming laptops');
  }
  if (lowerResponse.includes('xps')) {
    suggestions.push('XPS laptops', 'XPS desktops', 'Premium laptops');
  }
  if (lowerResponse.includes('inspiron')) {
    suggestions.push('Inspiron laptops', 'Budget laptops', 'Student laptops');
  }
  if (lowerResponse.includes('latitude')) {
    suggestions.push('Latitude laptops', 'Business laptops', 'Professional laptops');
  }
  if (lowerResponse.includes('optiplex')) {
    suggestions.push('OptiPlex desktops', 'Business desktops', 'Office computers');
  }
  if (lowerResponse.includes('precision')) {
    suggestions.push('Precision workstations', 'Professional workstations', 'CAD laptops');
  }
  if (lowerResponse.includes('gaming') || lowerQuery.includes('gaming')) {
    suggestions.push('Gaming laptops', 'Gaming desktops', 'Gaming accessories');
  }
  if (lowerResponse.includes('budget') || lowerQuery.includes('budget')) {
    suggestions.push('Budget laptops', 'Affordable options', 'Student discounts');
  }

  // Add some general suggestions if we don't have many specific ones
  if (suggestions.length < 3) {
    suggestions.push('Compare products', 'View all laptops', 'Check deals');
  }

  return suggestions.slice(0, 4); // Limit to 4 suggestions
}

function getFallbackResponse(message) {
  const lowerMessage = message.toLowerCase();
  let fallbackMessage = 'I can help you find Dell products! ';
  let suggestions = ['Search for laptops', 'Find gaming computers', 'Browse monitors', 'Look for accessories'];

  if (lowerMessage.includes('laptop')) {
    fallbackMessage += 'For laptops, I recommend checking out our XPS, Inspiron, and Latitude series. ';
    suggestions = ['XPS laptops', 'Budget laptops', 'Gaming laptops', 'Business laptops'];
  } else if (lowerMessage.includes('desktop')) {
    fallbackMessage += 'For desktops, consider our OptiPlex, Precision, and Alienware series. ';
    suggestions = ['OptiPlex desktops', 'Gaming desktops', 'Workstations', 'All-in-one PCs'];
  } else if (lowerMessage.includes('monitor')) {
    fallbackMessage += 'We have a great selection of monitors including UltraSharp, gaming, and portable options. ';
    suggestions = ['UltraSharp monitors', 'Gaming monitors', '4K monitors', 'Portable monitors'];
  } else if (lowerMessage.includes('budget') || lowerMessage.includes('cheap')) {
    fallbackMessage += 'For budget-friendly options, check out our Inspiron series and Dell Outlet for refurbished deals. ';
    suggestions = ['Budget laptops', 'Dell Outlet', 'Student discounts', 'Refurbished PCs'];
  }

  return {
    message: fallbackMessage + 'Use the search bar to find specific products, or click the chat icon for more detailed assistance.',
    suggestions
  };
}

module.exports = {
  sendChatMessage
};
