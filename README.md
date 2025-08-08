# AudioCourse AI

> Generate and listen to personalized AI-powered podcasts on any topic to accelerate your learning.

A production-ready web application that creates personalized 8-12 minute educational podcasts on any topic. Built with Next.js, ElevenLabs, and Supabase.

## ✨ Features

### Core Functionality
- **Any Topic Input**: Enter any subject you want to learn about - tech, science, history, arts, etc.
- **Personalized Content**: Tailor to your familiarity level (New/Some/Expert)
- **Context Focus**: Optional targeting for specific areas or applications
- **Smart Script Generation**: Uses OpenAI GPT-4 to create structured, educational content
- **High-Quality TTS**: ElevenLabs voices for natural-sounding audio
- **Download & Share**: Export MP3 audio and text transcripts

### Content Structure
Each podcast includes:
- **Overview**: 60-90 second intro tailored to familiarity level
- **Key Concepts**: 3-5 fundamental ideas with clear explanations
- **Applications & Examples**: Real-world uses and case studies
- **Challenges & Considerations**: Limitations, debates, and complexities
- **Learning Path**: Next steps and recommended resources
- **Summary & Takeaways**: Key points to remember
- **Glossary**: Important terms (for non-experts)
- **Sources**: Research links and references

### User Experience
- **Progressive Flow**: Topic → Script Preview → Audio Generation
- **Saved Episodes**: Automatic persistence of last 5 episodes
- **Playback Controls**: Speed adjustment, seeking, download
- **Responsive Design**: Works on desktop and mobile
- **Real-time Feedback**: Loading states and progress indicators

## 🛠 Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, OpenAI GPT-4
- **Audio**: ElevenLabs Text-to-Speech API
- **Database**: Supabase (PostgreSQL)
- **State Management**: Zustand
- **Deployment**: Vercel-ready
- **UI**: Heroicons, React Hot Toast

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn
- OpenAI API key
- ElevenLabs API key
- Supabase project

### Installation

1. **Clone and install dependencies**:
   ```bash
   git clone <your-repo>
   cd commercialize-cast
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.local.example .env.local
   ```
   
   Fill in your API keys:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ELEVENLABS_API_KEY=your_elevenlabs_key
   OPENAI_API_KEY=your_openai_key
   ```

3. **Set up the database**:
   - Create a new Supabase project
   - Run the SQL schema from `supabase/schema.sql`
   - Enable Row Level Security

4. **Start development server**:
   ```bash
   npm run dev
   ```

5. **Open in browser**: http://localhost:3000

## 📁 Project Structure

```
src/
├── app/                    # Next.js 13+ app directory
│   ├── api/               # API routes
│   │   ├── generate-script/
│   │   └── generate-audio/
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx          # Home page
├── components/            # React components
│   ├── TopicInput.tsx    # Input form
│   ├── ScriptPreview.tsx # Script display
│   ├── AudioPlayer.tsx   # Audio playback
│   ├── Library.tsx       # Library (saved episodes)
│   └── LoadingState.tsx  # Loading indicators
├── lib/                  # Core services
│   ├── supabase.ts      # Database client
│   ├── elevenlabs.ts    # TTS service
│   ├── script-generation.ts # OpenAI integration
│   └── store.ts         # Zustand state
├── types/               # TypeScript definitions
└── utils/              # Helper functions
```

## 🔧 Configuration

### OpenAI Setup
- Model: GPT-4 Turbo (recommended for best results)
- System prompt includes safety guidelines and content structure
- Temperature: 0.7 for creative but consistent output

### ElevenLabs Setup
- Default voices: Adam (CHRIS) and Bella (JESSICA)
- Voice settings optimized for podcast-style speech
- Configurable in `src/lib/elevenlabs.ts`

### Supabase Setup
- Row Level Security enabled
- Automatic episode saving (optional)
- JSON storage for flexible script structure

## 🎯 Content Guidelines

### Safety & Ethics
- **No medical advice**: Focuses on educational content, not health claims
- **No financial advice**: Discusses concepts, not investment advice
- **Realistic framing**: Acknowledges limitations and uncertainties honestly
- **Educational focus**: Targets learning and understanding primarily

### Content Quality
- **Balanced perspective**: Covers both opportunities and challenges
- **Specific examples**: Includes real-world applications
- **Actionable insights**: Provides concrete next steps
- **Source attribution**: Links to research and references

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm run build
vercel --prod
```

### Environment Variables for Production
- Set all environment variables in Vercel dashboard
- Ensure Supabase URLs are production endpoints
- Use production API keys for OpenAI and ElevenLabs

### Database Migration
- Import schema to production Supabase instance
- Configure Row Level Security policies
- Test database connectivity

## 📖 API Reference

### POST /api/generate-script
```typescript
// Request
{
  topic: string;
  familiarity: 'new' | 'some' | 'expert';
  industries: Industry[];
  useCase?: string;
}

// Response
PodcastScript
```

### POST /api/generate-audio
```typescript
// Request
{
  scriptId: string;
}

// Response
AudioGeneration
```

## 🔒 Security Considerations

- API routes validate input parameters
- Rate limiting recommended for production
- Supabase RLS protects user data
- Environment variables secured
- Content filtering for inappropriate topics

## 🎨 Customization

### Styling
- Tailwind CSS with custom color palette
- Responsive design utilities
- Dark mode ready (extend as needed)

### Voices
- Modify `DEFAULT_VOICES` in `src/lib/elevenlabs.ts`
- Add more hosts or voice variety
- Adjust voice settings for different styles

### Content Structure
- Update system prompt in `src/lib/script-generation.ts`
- Modify podcast sections and timing
- Add custom industry knowledge

## 🐛 Troubleshooting

### Common Issues
1. **API Key Errors**: Verify all environment variables
2. **Audio Generation Fails**: Check ElevenLabs quota and voice IDs
3. **Database Errors**: Ensure Supabase RLS policies are correct
4. **Build Errors**: Check TypeScript types and imports

### Debug Mode
```bash
# Enable detailed logging
export DEBUG=commercialize-cast:*
npm run dev
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure TypeScript types are correct
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- OpenAI for GPT-4 API
- ElevenLabs for high-quality TTS
- Supabase for backend infrastructure
- Vercel for hosting platform
- Tailwind CSS for styling system

---

**Built for AI-powered learning experiences** 🚀
