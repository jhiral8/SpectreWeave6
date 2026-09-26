# SpectreWeave6

**Advanced AI-Powered Block Editor for Creative Writing**

SpectreWeave6 is a sophisticated, collaborative writing platform built with Next.js 15 and TipTap v3.x. It combines an advanced block-based editor with powerful AI assistance, real-time collaboration, and intelligent character consistency management for fiction writers and content creators.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15.4.6-black.svg)
![React](https://img.shields.io/badge/React-19.1.1-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.1.6-blue.svg)
![TipTap](https://img.shields.io/badge/TipTap-3.x-green.svg)

## 🌟 Features

### ✍️ Advanced Writing Environment
- **Dual Writing Surface**: Main editor alongside framework/outline editor
- **Block-based editing** with custom TipTap extensions
- **Real-time collaborative editing** with cursor tracking
- **Advanced typography** and formatting options
- **Smart auto-completion** and AI-powered suggestions

### 🤖 AI-Powered Assistance
- **Multi-provider AI support** (Azure OpenAI, Gemini, Databricks, Anthropic)
- **Intelligent text generation** with context awareness
- **Style analysis** and writing feedback
- **Cost optimization** with provider fallbacks
- **Character consistency checking** via OpenCLIP embeddings

### 👥 Collaboration & Project Management
- **Real-time collaborative editing** via Y.js and Ably
- **Project-based organization** with user isolation
- **Version history** and change tracking
- **User presence** and activity tracking
- **Secure sharing** with permission controls

### 📚 Character & Story Management
- **Character profiles** with visual descriptions
- **Personality and trait tracking**
- **Visual consistency analysis** via embeddings
- **GraphRAG integration** for story element relationships
- **Reference management** and visual libraries

> Character consistency, GraphRAG character routes and the children's-book generator are not currently wired in. The code is kept in [`salvage/`](salvage/README.md).

### 🔍 Knowledge & Research
- **Neo4j-powered knowledge graphs** for story elements
- **Vector embeddings** for semantic search
- **Context-aware content retrieval**
- **Research integration** and note management

## 🛠️ Technology Stack

### Frontend
- **Next.js 15.4.6** with App Router
- **React 19.1.1** with modern hooks
- **TypeScript 5.1.6** for type safety
- **Tailwind CSS 3.3.3** with custom design system
- **Framer Motion** for animations

### Editor & Collaboration
- **TipTap v3.x** block editor framework
- **Y.js** for real-time collaboration
- **@hocuspocus/provider** for collaborative infrastructure
- **Ably** for real-time communication

### AI & ML
- **Multiple AI Providers**: Azure OpenAI, Gemini, Databricks, Anthropic
- **LangChain/LangGraph** for agent orchestration
- **OpenCLIP** microservice for image embeddings
- **Vector embeddings** for semantic analysis

### Database & Storage
- **Supabase** (PostgreSQL) for main database
- **Neo4j** for knowledge graphs and GraphRAG
- **Redis** for caching (via OpenCLIP service)

### UI Components
- **Radix UI** for accessible components
- **Lucide React** for icons
- **React Query** for state management
- **Custom design system** with Tailwind CSS

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and npm
- **Supabase** account and project
- **AI Provider** API keys (Azure OpenAI, Gemini, etc.)
- **Neo4j** database (optional, for GraphRAG features)
- **Docker** (for OpenCLIP service)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/jhiral8/SpectreWeave6.git
   cd SpectreWeave6
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env.local
   ```

   Configure your environment variables:
   ```env
   # Database
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

   # AI Services
   GEMINI_API_KEY=your-gemini-api-key
   AZURE_OPENAI_ENDPOINT=your-azure-endpoint
   AZURE_OPENAI_API_KEY=your-azure-key

   # Collaboration
   ABLY_API_KEY=your-ably-api-key

   # Neo4j (optional)
   NEO4J_URI=neo4j://localhost:7687
   NEO4J_USERNAME=neo4j
   NEO4J_PASSWORD=your-password
   ```

4. **Start OpenCLIP service** (for character consistency)
   ```bash
   npm run clip:start
   ```

5. **Run development server**
   ```bash
   npm run dev
   ```

6. **Open application**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
SpectreWeave6/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   │   ├── bridge/        # Bridge API layer
│   │   │   ├── ai/           # AI service endpoints
│   │   │   ├── auth/         # Authentication
│   │   │   └── collaboration/# Real-time features
│   │   ├── portal/           # Main application portal
│   │   │   ├── (auth)/       # Authentication pages
│   │   │   └── (dash)/       # Dashboard and main app
│   │   └── globals.css       # Global styles
│   ├── components/           # React components
│   │   ├── BlockEditor/      # Editor components
│   │   ├── ui/              # UI component library
│   │   ├── portal/          # Portal-specific components
│   │   └── ai/              # AI integration components
│   ├── extensions/          # Custom TipTap extensions
│   │   ├── CharacterProfileBlock/
│   │   ├── SlashCommand/
│   │   ├── ResearchBlock/
│   │   └── AuthorStyleBlock/
│   ├── lib/                 # Utility libraries
│   │   ├── ai/             # AI service integrations
│   │   ├── supabase/       # Database utilities
│   │   ├── utils/          # General utilities
│   │   └── services/       # External service integrations
│   ├── contexts/           # React contexts
│   ├── hooks/             # Custom React hooks
│   ├── types/             # TypeScript type definitions
│   ├── services/          # Microservices
│   │   └── openclip/      # OpenCLIP embedding service
│   └── styles/            # CSS and styling
├── database/              # Database schemas and migrations
├── scripts/              # Build and deployment scripts
├── tests/               # Test files (Playwright)
├── public/              # Static assets
└── docs/               # Documentation
```

### Key Directories Explained

#### `src/app/api/bridge/`
Unified API layer that abstracts external services:
- **AI services** with provider fallbacks
- **Authentication** management
- **GraphRAG** and knowledge graph operations
- **Project management** CRUD operations
- **Health monitoring** and analytics

#### `src/components/BlockEditor/`
Core editor functionality:
- `BlockEditor.tsx` - Main editor wrapper
- `DualBlockEditor.tsx` - Dual-surface editing interface
- `MicroEditor.tsx` - Lightweight editor component
- Custom hooks and context providers

#### `src/extensions/`
Custom TipTap extensions:
- **CharacterProfileBlock** - Character management integration
- **SlashCommand** - Command palette for quick actions
- **ResearchBlock** - Research note management
- **AuthorStyleBlock** - Style analysis and suggestions
- **GhostCompletion** - AI-powered auto-completion

#### `src/services/openclip/`
OpenCLIP microservice for character consistency:
- **Docker-based** Python service
- **Redis caching** for performance
- **Prometheus metrics** for monitoring
- **Azure deployment** ready

## 🔧 Development

### Available Scripts

#### Development
```bash
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run ESLint
npm run lint:fix        # Fix ESLint issues
npm run format          # Format code with Prettier
```

#### Testing
```bash
npm run test:e2e        # Run E2E tests
npm run test:e2e:ui     # Run E2E tests with UI
npm run test:a11y       # Run accessibility tests
npm run test:all        # Run all tests
```

#### OpenCLIP Service
```bash
npm run clip:start      # Start OpenCLIP service
npm run clip:stop       # Stop OpenCLIP service
npm run clip:status     # Check service status
npm run clip:logs       # View service logs
npm run clip:test       # Test service endpoints
npm run clip:build      # Build Docker image
```

#### Deployment
```bash
npm run azure:deploy    # Deploy to Azure
npm run netlify:build   # Build for Netlify
npm run netlify:deploy  # Deploy to Netlify
```

### Development Guidelines

#### Code Organization
- Use **TypeScript** for all new code
- Follow **React best practices** with hooks
- Implement **error boundaries** for component isolation
- Use **custom hooks** for reusable logic
- Follow **atomic design principles** for components

#### API Development
- Use the **Bridge API pattern** for external services
- Implement **proper error handling** and retries
- Add **health checks** for external dependencies
- Use **TypeScript** for API route definitions
- Follow **RESTful conventions** where applicable

#### Performance
- Use **React.memo** for expensive components
- Implement **lazy loading** for heavy components
- Use **React Query** for efficient data fetching
- Optimize **bundle sizes** with dynamic imports
- Monitor **memory usage** for large documents

## 🔐 Authentication & Security

### Authentication Flow
1. **Supabase Auth** for user authentication
2. **Row-level security (RLS)** for data protection
3. **JWT tokens** for API authentication
4. **Session management** with automatic refresh

### Security Features
- **Environment variable** protection
- **API rate limiting**
- **Input validation** with Zod schemas
- **SQL injection** prevention via Supabase
- **XSS protection** with React's built-in escaping

## 🤖 AI Integration

### Supported Providers
- **Azure OpenAI** - Primary provider for GPT models
- **Google Gemini** - Alternative provider with multimodal capabilities
- **Databricks** - Enterprise AI platform integration
- **Anthropic Claude** - Advanced reasoning capabilities
- **Stability AI** - Image generation and processing

### AI Features
- **Smart text generation** with context awareness
- **Character consistency** checking via embeddings
- **Style analysis** and writing improvement suggestions
- **Automatic completions** and suggestions
- **Cost optimization** with intelligent provider fallbacks

### Configuration
AI providers are configured via environment variables and can be toggled based on availability and cost considerations.

## 📊 Analytics & Monitoring

### Built-in Analytics
- **User activity** tracking
- **AI usage** and cost monitoring
- **Performance metrics** for editor operations
- **Collaboration statistics**
- **Error tracking** and reporting

### Health Monitoring
- **Service health checks** for external dependencies
- **Database connection** monitoring
- **AI provider** availability tracking
- **Real-time collaboration** status monitoring

## 🚀 Deployment

### Production Requirements
- **Node.js 18+** runtime
- **PostgreSQL** database (via Supabase)
- **Redis** for caching (optional)
- **Neo4j** for GraphRAG (optional)
- **Docker** for OpenCLIP service

### Deployment Platforms

#### Vercel (Recommended)
```bash
# Deploy to Vercel with optimal settings
vercel --prod
```

#### Azure Container Instances
```bash
# Deploy OpenCLIP service to Azure
npm run azure:deploy
```

#### Netlify
```bash
# Convert API routes to Netlify Functions
npm run netlify:functions
npm run netlify:deploy
```

### Environment Configuration

#### Production Environment Variables
```env
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=your-production-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-production-service-key
# ... other production variables
```

#### Performance Optimizations
- **Memory allocation**: 4GB for large document processing
- **Build optimization**: Static generation where possible
- **Edge runtime**: For faster API responses
- **CDN integration**: For static asset delivery

## 🧪 Testing

### Test Coverage
- **End-to-end tests** with Playwright
- **Accessibility testing** with axe-core
- **Component testing** with Testing Library
- **API endpoint testing**

### Test Files
```
tests/
├── children-books-workflow.spec.ts  # E2E workflow tests
├── accessibility.spec.ts           # A11y compliance tests
└── api/                           # API endpoint tests
```

### Running Tests
```bash
# Run all tests
npm run test:all

# Run tests with UI
npm run test:e2e:ui

# Run accessibility tests
npm run test:a11y
```

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Follow the coding guidelines
4. Add tests for new features
5. Submit a pull request

### Code Style
- **ESLint** for code linting
- **Prettier** for code formatting
- **TypeScript** for type safety
- **Conventional commits** for commit messages

### Pull Request Process
1. Update documentation for new features
2. Add tests for bug fixes and new functionality
3. Ensure all tests pass
4. Update CHANGELOG.md if applicable

## 📝 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## 🆘 Support

### Documentation
- **API Documentation**: Available in `/docs/api/`
- **Component Storybook**: Run `npm run storybook`
- **Architecture Guide**: See `/docs/architecture.md`

### Community
- **Issues**: Report bugs via GitHub Issues
- **Discussions**: Join GitHub Discussions for questions
- **Discord**: Join our Discord community for real-time support

### Enterprise Support
For enterprise support, custom features, and professional services, contact the development team.

---

## 🏗️ Architecture Overview

SpectreWeave6 follows a modular, scalable architecture designed for performance and maintainability:

### Frontend Architecture
- **Component-driven** development with React 19
- **Atomic design** principles for UI components
- **Context-based** state management
- **Custom hooks** for business logic
- **Error boundaries** for fault tolerance

### Backend Architecture
- **API-first** design with Next.js API routes
- **Bridge pattern** for external service integration
- **Microservices** for specialized functionality
- **Database abstraction** with Supabase
- **Real-time** communication via WebSockets

### Data Flow
```
User Interaction → React Component → Custom Hook → API Route → External Service
                                  ↓
                              State Update → UI Re-render
```

### Performance Considerations
- **Lazy loading** for code splitting
- **Memoization** for expensive computations
- **Virtual scrolling** for large documents
- **Debouncing** for real-time collaboration
- **Caching strategies** for API responses

---

Built with ❤️ by the SpectreWeave team. Happy writing! ✍️