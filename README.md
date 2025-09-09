# Dell Search Demo - Next-Gen E-commerce Experience

A modern, AI-powered e-commerce demo showcasing Dell's next-generation website experience using Elastic Serverless and Elastic 1Chat.

## 🚀 Features

- **AI-Powered Search**: Intelligent product search powered by Elastic Serverless
- **Smart Chat Assistant**: Interactive AI assistant using Elastic 1Chat for personalized recommendations
- **Modern UI/UX**: Beautiful, responsive design inspired by Dell's branding
- **Real-time Results**: Instant search results with live product information
- **Interactive Suggestions**: Clickable search suggestions and follow-up questions
- **Dual Search Interface**: Independent header and hero search bars

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **Search**: Elastic Serverless (search-dell index)
- **AI Chat**: Elastic 1Chat for conversational AI
- **Styling**: Custom Dell branding with responsive design
- **API**: RESTful API routes for search and chat functionality

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Elastic Serverless access
- Elastic 1Chat access

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone git@github.com:poulsbopete/dell-search.git
   cd dell-search
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   # OpenAI API Key (for fallback responses)
   OPENAI_API_KEY=your_openai_api_key_here
   
   # Elasticsearch Configuration
   ELASTICSEARCH_URL=https://your-elasticsearch-url
   ELASTICSEARCH_API_KEY=your_elasticsearch_api_key
   ELASTICSEARCH_INDEX=search-dell
   
   # Elastic 1Chat Configuration
   ELASTIC_1CHAT_URL=https://your-1chat-url
   ELASTIC_1CHAT_API_KEY=your_1chat_api_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎯 Usage

### Search Functionality
- **Header Search**: Type in the top navigation bar for quick searches with suggestions
- **Hero Search**: Use the main search bar in the hero section for primary searches
- **AI Integration**: Each search includes AI-powered responses and recommendations

### Chat Assistant
- Click the chat icon in the header to open the AI assistant
- Ask questions about products, get recommendations, or compare options
- Interactive suggestions and follow-up questions

### Search Results
- View AI-generated responses at the top of search results
- Click on suggestion buttons for related searches
- Use follow-up question buttons for more information
- Browse product cards with detailed information

## 📁 Project Structure

```
dell-search/
├── app/
│   ├── api/
│   │   ├── search/route.ts      # Search API endpoint
│   │   └── chat/route.ts        # Chat API endpoint
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Main page component
├── components/
│   ├── SearchResults.tsx        # Search results display
│   ├── ProductCard.tsx          # Individual product card
│   └── ChatInterface.tsx        # Chat widget
├── lib/
│   ├── elastic.ts               # Elasticsearch integration
│   └── chat.ts                  # Elastic 1Chat integration
├── .env.local                   # Environment variables
├── next.config.js               # Next.js configuration
├── tailwind.config.js           # Tailwind CSS configuration
└── package.json                 # Dependencies
```

## 🔌 API Endpoints

### Search API
- **GET** `/api/search?q={query}&includeChat=true`
  - Returns search results and AI chat response
  - Parameters:
    - `q`: Search query
    - `includeChat`: Include AI response (optional)

### Chat API
- **POST** `/api/chat`
  - Sends message to Elastic 1Chat
  - Returns AI response with suggestions

## 🎨 Customization

### Dell Branding
The application uses custom Dell colors defined in `tailwind.config.js`:
- `dell-blue`: Primary Dell blue
- `dell-darkblue`: Darker blue variant
- `dell-lightblue`: Light blue accent

### Styling
- Global styles in `app/globals.css`
- Component-specific styles using Tailwind CSS
- Responsive design for mobile and desktop

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Other Platforms
The application can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- Railway
- DigitalOcean App Platform

## 🔧 Configuration

### Elasticsearch Setup
Ensure your Elasticsearch index (`search-dell`) contains product data with the following structure:
```json
{
  "title": "Product Name",
  "description": "Product Description",
  "price": "Price",
  "category": "Category",
  "image": "Image URL",
  "url": "Product URL"
}
```

### Elastic 1Chat Setup
Configure your 1Chat assistant with:
- Product knowledge base
- Dell-specific training data
- Appropriate response templates

## 🐛 Troubleshooting

### Common Issues

1. **Compilation Errors**
   - Ensure all dependencies are installed: `npm install`
   - Check Node.js version (18+ required)

2. **API Connection Issues**
   - Verify environment variables are set correctly
   - Check API keys and URLs
   - Ensure network connectivity

3. **Search Not Working**
   - Verify Elasticsearch index exists
   - Check API key permissions
   - Review console for error messages

4. **Chat Not Responding**
   - Verify 1Chat API credentials
   - Check 1Chat service status
   - Review chat API logs

## 📝 Development

### Adding New Features
1. Create new components in `components/`
2. Add API routes in `app/api/`
3. Update types in relevant files
4. Test thoroughly before committing

### Code Style
- Use TypeScript for type safety
- Follow Next.js best practices
- Use Tailwind CSS for styling
- Maintain consistent naming conventions

## 📄 License

This project is a demo application for showcasing Dell's next-generation e-commerce experience.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For questions or issues:
- Check the troubleshooting section
- Review the console for error messages
- Ensure all prerequisites are met
- Verify API credentials and connectivity

---

**Built with ❤️ for Dell's Next-Gen E-commerce Experience**