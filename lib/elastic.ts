export interface SearchResult {
  id: string
  title: string
  description: string
  price?: string
  category?: string
  image?: string
  url?: string
  _score: number
}

export interface SearchResponse {
  hits: {
    total: { value: number }
    hits: Array<{
      _id: string
      _score: number
      _source: any
    }>
  }
}

async function elasticRequest(endpoint: string, body: any) {
  const url = `${process.env.ELASTICSEARCH_URL}/${process.env.ELASTICSEARCH_INDEX}/${endpoint}`
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `ApiKey ${process.env.ELASTICSEARCH_API_KEY}`
    },
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    throw new Error(`Elasticsearch request failed: ${response.status}`)
  }

  return response.json()
}

export async function searchProducts(query: string, size: number = 10): Promise<SearchResult[]> {
  try {
    const body = {
      query: {
        multi_match: {
          query: query,
          fields: ['title^2', 'description', 'category', 'brand'],
          type: 'best_fields',
          fuzziness: 'AUTO'
        }
      },
      size: size,
      _source: ['title', 'description', 'price', 'category', 'image', 'url']
    }

    const response = await elasticRequest('_search', body)

    return response.hits.hits.map((hit: any) => ({
      id: hit._id,
      title: hit._source.title || 'Untitled',
      description: hit._source.description || '',
      price: hit._source.price,
      category: hit._source.category,
      image: hit._source.image,
      url: hit._source.url,
      _score: hit._score
    }))
  } catch (error) {
    console.error('Elasticsearch error:', error)
    return []
  }
}

export async function getSuggestions(query: string): Promise<string[]> {
  try {
    // For now, return static suggestions since the completion field might not be configured
    const staticSuggestions = [
      'laptops',
      'desktops',
      'monitors',
      'gaming computers',
      'workstations',
      'servers',
      'accessories',
      'budget laptops',
      'business laptops',
      'gaming laptops'
    ]
    
    return staticSuggestions.filter(suggestion => 
      suggestion.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5)
  } catch (error) {
    console.error('Elasticsearch suggestions error:', error)
    return []
  }
}
