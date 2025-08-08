# AudioCourse AI - Development Guide

## 🎯 Project Overview

AudioCourse AI is a production-ready web application that generates personalized 8-12 minute podcasts on any learning topic. Users input any subject they want to learn about, specify their familiarity level, and optionally target specific areas to receive a structured, educational analysis delivered via high-quality text-to-speech.

## 🏗️ Architecture

### Frontend (Next.js 14)
- **Framework**: Next.js with App Router
- **Styling**: Tailwind CSS with custom design system
- **State**: Zustand for client-side state management
- **Components**: Modular React components with TypeScript
- **UI Library**: Heroicons, React Hot Toast

### Backend (API Routes)
- **Script Generation**: OpenAI GPT-4 with structured prompts
- **Audio Generation**: ElevenLabs TTS with dual-voice support
- **Data Persistence**: Supabase PostgreSQL with RLS

### Key Features
- Progressive user flow (Topic → Script → Audio)
- Real-time generation with loading states
- Episode persistence (last 5 episodes)
- Audio playback with speed controls
- Download capabilities (MP3 + transcript)

## 📦 Project Structure

```
src/
├── app/                     # Next.js App Router
│   ├── api/                # Server-side API endpoints
│   │   ├── generate-script/ # OpenAI script generation
│   │   └── generate-audio/  # ElevenLabs audio synthesis
│   ├── globals.css         # Tailwind base styles
│   ├── layout.tsx          # Root application layout
│   └── page.tsx           # Main application page
├── components/             # React UI components
│   ├── TopicInput.tsx     # User input form
│   ├── ScriptPreview.tsx  # Generated script display
│   ├── AudioPlayer.tsx    # Audio playback interface
│   ├── Library.tsx       # Library (saved episodes)
│   └── LoadingState.tsx   # Loading animations
├── lib/                   # Core business logic
│   ├── supabase.ts       # Database client configuration
│   ├── elevenlabs.ts     # TTS service integration
│   ├── script-generation.ts # OpenAI integration
│   └── store.ts          # Zustand state management
├── types/                 # TypeScript type definitions
│   └── index.ts          # All application types
└── utils/                # Helper utilities
    └── index.ts          # Common utility functions
```

## 🔧 API Integration Details

### OpenAI GPT-4 Integration
- **Model**: `gpt-4-turbo-preview` for best results
- **Temperature**: 0.7 (balanced creativity/consistency)
- **System Prompt**: Structured with safety guidelines
- **Output Format**: Validated JSON with required sections

### ElevenLabs TTS Integration
- **Voices**: Adam (CHRIS) and Bella (JESSICA)
- **Quality Settings**: Optimized for podcast-style speech
- **Output**: MP3 format with configurable quality

### Supabase Database
- **Schema**: Episodes table with JSONB script storage
- **Security**: Row Level Security (RLS) enabled
- **Features**: Automatic timestamps, user isolation

## 🚀 Development Workflow

### 1. Initial Setup
```bash
# Clone and install
git clone <repository>
cd commercialize-cast
npm install

# Setup environment
cp .env.local.example .env.local
# Edit .env.local with your API keys

# Database setup
# Run SQL from supabase/schema.sql in your Supabase project
```

### 2. Required API Keys
- **OpenAI**: Get from https://platform.openai.com/api-keys
- **ElevenLabs**: Get from https://elevenlabs.io/app/settings/api-keys
- **Supabase**: Get from your project settings

### 3. Development Commands
```bash
npm run dev         # Start development server
npm run build       # Production build
npm run lint        # ESLint check
npm run type-check  # TypeScript validation
```

## 📋 Content Structure

Each generated podcast includes:

### 1. Overview (60-90 seconds)
- Technology introduction
- Tailored to user's familiarity level
- Commercial relevance context

### 2. Monetization Models (3-5 models)
- Revenue model classification
- Go-to-market strategies
- Target customer segments
- Implementation timeline

### 3. Moats & Risks Analysis
- **Competitive Moats**: Defensible advantages
- **Technical Risks**: Implementation challenges
- **Regulatory Risks**: Compliance considerations
- **Data Risks**: Privacy and security issues
- **Distribution Risks**: Market access challenges

### 4. Build vs Buy Guidance
- Strategic recommendation
- Resource requirements
- Timeline estimates
- Key decision factors

### 5. 30-Day Action Plan
- Specific, actionable steps
- Prioritized by impact
- Resource allocation guidance

### 6. Supporting Content
- **Glossary**: Technical terms (non-expert users)
- **Sources**: Research links and references

## 🔒 Safety & Content Guidelines

### Content Safety
- **No Medical Advice**: Focus on business applications only
- **No Financial Advice**: Discuss models, not investment recommendations
- **Realistic Framing**: Acknowledge limitations and risks
- **Source Attribution**: Include credible references

### Technical Safety
- **Input Validation**: Sanitize all user inputs
- **Rate Limiting**: Prevent API abuse (production)
- **Error Handling**: Graceful degradation
- **Data Privacy**: No PII storage without consent

## 🎨 UI/UX Design System

### Color Palette
- **Primary**: Blue tones (#3b82f6 family)
- **Accent**: Purple tones (#d946ef family)
- **Neutral**: Gray scale for content
- **Status**: Green (success), Red (error), Amber (warning)

### Typography
- **Font**: Inter (system fallbacks)
- **Hierarchy**: Clear heading structure
- **Readability**: Optimized line heights and spacing

### Components
- **Cards**: White background with subtle shadows
- **Buttons**: Primary (filled) and secondary (outlined)
- **Forms**: Clean inputs with focus states
- **Loading**: Animated spinners and progress indicators

## 🚀 Deployment Guide

### Vercel (Recommended)
1. **Connect Repository**: Link your GitHub repo
2. **Environment Variables**: Set in Vercel dashboard
3. **Build Settings**: Auto-detected (Next.js)
4. **Domain**: Configure custom domain if needed

### Environment Variables for Production
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ELEVENLABS_API_KEY=your_elevenlabs_key
OPENAI_API_KEY=your_openai_key
```

### Database Migration
1. Create production Supabase project
2. Run schema from `supabase/schema.sql`
3. Configure RLS policies
4. Test connectivity

## 📊 Performance Considerations

### Optimization Strategies
- **Static Generation**: Homepage and marketing pages
- **API Caching**: Consider Redis for repeated requests
- **Image Optimization**: Next.js automatic optimization
- **Bundle Size**: Code splitting and tree shaking

### Monitoring
- **Error Tracking**: Implement Sentry or similar
- **Performance**: Vercel Analytics or alternatives
- **API Usage**: Monitor OpenAI and ElevenLabs quotas

## 🔍 Testing Strategy

### Unit Tests (Recommended)
```bash
# Add to package.json
npm install --save-dev jest @testing-library/react
npm install --save-dev @testing-library/jest-dom
```

### Integration Tests
- API route testing
- Database interaction validation
- External service mocking

### E2E Tests
- Complete user workflows
- Error state handling
- Cross-browser compatibility

## 🐛 Common Issues & Solutions

### Build Issues
- **TypeScript Errors**: Check type imports and definitions
- **Missing Dependencies**: Ensure all packages are installed
- **Environment Variables**: Verify all required keys are set

### Runtime Issues
- **API Failures**: Check quotas and key validity
- **Database Errors**: Verify Supabase connection and RLS
- **Audio Generation**: Confirm ElevenLabs voice availability

### Performance Issues
- **Slow Generation**: Monitor API response times
- **Memory Usage**: Check for memory leaks in audio handling
- **Bundle Size**: Analyze with webpack-bundle-analyzer

## 🔄 Future Enhancements

### Short-term
- User authentication and profiles
- Episode sharing capabilities
- Custom voice selection
- Advanced audio controls

### Medium-term
- Multi-language support
- Industry-specific models
- Collaboration features
- Analytics dashboard

### Long-term
- Custom voice training
- Video generation
- API marketplace integration
- Enterprise features

## 📚 Resources

### Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Supabase Guide](https://supabase.com/docs)
- [OpenAI API Reference](https://platform.openai.com/docs)
- [ElevenLabs Documentation](https://docs.elevenlabs.io/)

### Community
- [Next.js GitHub](https://github.com/vercel/next.js)
- [Supabase Community](https://github.com/supabase/supabase)
- [OpenAI Community](https://community.openai.com/)

---

**Built with ❤️ for AI-powered learning experiences**
