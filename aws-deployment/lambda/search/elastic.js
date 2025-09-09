const https = require('https');
const http = require('http');

async function elasticRequest(endpoint, method = 'GET', body = null) {
  const url = new URL(`${process.env.ELASTICSEARCH_URL}${endpoint}`);
  
  const options = {
    hostname: url.hostname,
    port: url.port || (url.protocol === 'https:' ? 443 : 80),
    path: url.pathname + url.search,
    method,
    headers: {
      'Authorization': `ApiKey ${process.env.ELASTICSEARCH_API_KEY}`,
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.headers['Content-Length'] = Buffer.byteLength(body);
  }

  return new Promise((resolve, reject) => {
    const client = url.protocol === 'https:' ? https : http;
    
    const req = client.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsedData);
          } else {
            reject(new Error(`Elasticsearch request failed: ${res.statusCode}`));
          }
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });

    if (body) {
      req.write(body);
    }
    
    req.end();
  });
}

async function searchProducts(query, size = 20) {
  try {
    const searchBody = {
      query: {
        multi_match: {
          query,
          fields: ['title^2', 'description', 'category'],
          type: 'best_fields',
          fuzziness: 'AUTO'
        }
      },
      size,
      _source: ['title', 'description', 'price', 'category', 'image', 'url']
    };

    const response = await elasticRequest(
      `/${process.env.ELASTICSEARCH_INDEX}/_search`,
      'POST',
      JSON.stringify(searchBody)
    );

    return response.hits.hits.map(hit => ({
      id: hit._id,
      title: hit._source.title || 'No title',
      description: hit._source.description || 'No description',
      price: hit._source.price,
      category: hit._source.category,
      image: hit._source.image,
      url: hit._source.url,
      _score: hit._score
    }));
  } catch (error) {
    console.error('Elasticsearch search error:', error);
    return [];
  }
}

async function getSuggestions(query, size = 5) {
  try {
    // For now, return static suggestions as fallback
    // In production, you would implement completion suggester
    const staticSuggestions = [
      'gaming laptop',
      'business laptop',
      'desktop computer',
      'monitor',
      'accessories',
      'XPS laptop',
      'Inspiron laptop',
      'Alienware desktop',
      'UltraSharp monitor',
      'wireless mouse'
    ];

    return staticSuggestions
      .filter(suggestion => 
        suggestion.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, size);
  } catch (error) {
    console.error('Elasticsearch suggestions error:', error);
    return [];
  }
}

module.exports = {
  searchProducts,
  getSuggestions
};
