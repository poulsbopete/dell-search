import { getCachedProductImage } from './imageService'

export interface SearchResult {
  id: string
  title: string
  description: string
  price?: string
  category?: string
  image?: string
  url?: string
  rating?: number
  reviews?: number
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
      _source: ['title', 'description', 'price', 'category', 'image', 'url', 'rating', 'reviews']
    }

    const response = await elasticRequest('_search', body)

    const results = response.hits.hits.map((hit: any) => ({
      id: hit._id,
      title: hit._source.title || 'Untitled',
      description: hit._source.description || '',
      price: hit._source.price,
      category: hit._source.category,
      image: hit._source.image,
      url: hit._source.url,
      rating: hit._source.rating,
      reviews: hit._source.reviews,
      _score: hit._score
    }))

    // Enhance results with real images
    const enhancedResults = await Promise.all(
      results.map(async (result: SearchResult) => {
        if (!result.image) {
          try {
            const imageResult = await getCachedProductImage(result.title, result.category)
            return {
              ...result,
              image: imageResult.url
            }
          } catch (error) {
            console.error('Error enhancing image for product:', result.title, error)
            return result
          }
        }
        return result
      })
    )

    return enhancedResults
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
