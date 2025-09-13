import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface ImageResult {
  url: string
  alt: string
  source: 'dell' | 'ai' | 'placeholder'
}

// Dell product image patterns and fallback URLs
const DELL_IMAGE_PATTERNS = {
  laptop: 'https://i.dell.com/sites/csdocuments/Product_Docs/en/laptop-placeholder.jpg',
  desktop: 'https://i.dell.com/sites/csdocuments/Product_Docs/en/desktop-placeholder.jpg',
  monitor: 'https://i.dell.com/sites/csdocuments/Product_Docs/en/monitor-placeholder.jpg',
  server: 'https://i.dell.com/sites/csdocuments/Product_Docs/en/server-placeholder.jpg',
  workstation: 'https://i.dell.com/sites/csdocuments/Product_Docs/en/workstation-placeholder.jpg',
  default: 'https://i.dell.com/sites/csdocuments/Product_Docs/en/product-placeholder.jpg'
}

// High-quality placeholder images from Unsplash
const PLACEHOLDER_IMAGES = {
  laptop: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=300&fit=crop&crop=center',
  desktop: 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=400&h=300&fit=crop&crop=center',
  monitor: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&h=300&fit=crop&crop=center',
  server: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=300&fit=crop&crop=center',
  workstation: 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=400&h=300&fit=crop&crop=center',
  gaming: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400&h=300&fit=crop&crop=center',
  business: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop&crop=center',
  default: 'https://images.unsplash.com/photo-1593640408182-d31b5e8b2bdc?w=400&h=300&fit=crop&crop=center'
}

export function getProductImageUrl(productTitle: string, productCategory?: string): ImageResult {
  const title = productTitle.toLowerCase()
  const category = productCategory?.toLowerCase() || ''
  
  // Try to determine product type from title and category
  let productType = 'default'
  
  if (title.includes('laptop') || title.includes('notebook') || title.includes('inspiron') || title.includes('xps') || title.includes('latitude')) {
    productType = 'laptop'
  } else if (title.includes('desktop') || title.includes('optiplex') || title.includes('vostro')) {
    productType = 'desktop'
  } else if (title.includes('monitor') || title.includes('display') || title.includes('ultrasharp')) {
    productType = 'monitor'
  } else if (title.includes('server') || title.includes('poweredge') || title.includes('rack')) {
    productType = 'server'
  } else if (title.includes('workstation') || title.includes('precision')) {
    productType = 'workstation'
  } else if (title.includes('gaming') || title.includes('alienware')) {
    productType = 'gaming'
  } else if (title.includes('business') || title.includes('enterprise')) {
    productType = 'business'
  }
  
  // Use category if available
  if (category) {
    if (category.includes('laptop')) productType = 'laptop'
    else if (category.includes('desktop')) productType = 'desktop'
    else if (category.includes('monitor')) productType = 'monitor'
    else if (category.includes('server')) productType = 'server'
    else if (category.includes('workstation')) productType = 'workstation'
    else if (category.includes('gaming')) productType = 'gaming'
    else if (category.includes('business')) productType = 'business'
  }
  
  // Return high-quality placeholder image
  const imageUrl = PLACEHOLDER_IMAGES[productType as keyof typeof PLACEHOLDER_IMAGES] || PLACEHOLDER_IMAGES.default
  
  return {
    url: imageUrl,
    alt: `${productTitle} - Dell Product`,
    source: 'placeholder'
  }
}

export async function generateProductImage(productTitle: string, productCategory?: string): Promise<ImageResult> {
  try {
    // Create a detailed prompt for DALL-E
    const prompt = `Professional product photography of a ${productTitle} ${productCategory ? `(${productCategory})` : ''} computer/technology device, clean white background, studio lighting, high quality, commercial photography style, Dell branding visible, modern and sleek design`
    
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      style: "natural"
    })
    
    if (response.data && response.data[0]?.url) {
      return {
        url: response.data[0].url,
        alt: `${productTitle} - AI Generated`,
        source: 'ai'
      }
    }
  } catch (error) {
    console.error('Error generating AI image:', error)
  }
  
  // Fallback to placeholder
  return getProductImageUrl(productTitle, productCategory)
}

export async function getEnhancedProductImage(productTitle: string, productCategory?: string, useAI: boolean = false): Promise<ImageResult> {
  // For now, use high-quality placeholder images
  // In production, you could implement AI image generation for premium products
  return getProductImageUrl(productTitle, productCategory)
}

// Cache for generated images to avoid repeated API calls
const imageCache = new Map<string, ImageResult>()

export async function getCachedProductImage(productTitle: string, productCategory?: string): Promise<ImageResult> {
  const cacheKey = `${productTitle}-${productCategory || 'default'}`
  
  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey)!
  }
  
  const imageResult = await getEnhancedProductImage(productTitle, productCategory)
  imageCache.set(cacheKey, imageResult)
  
  return imageResult
}
