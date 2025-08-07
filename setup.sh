#!/bin/bash

# CommercializeCast Setup Script

echo "🚀 Setting up CommercializeCast..."

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "📄 Creating .env.local from template..."
    cp .env.local.example .env.local
    echo "⚠️  Please edit .env.local with your API keys before running the app"
else
    echo "✅ .env.local already exists"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project to check for errors
echo "🔨 Building project..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "🎉 Setup complete!"
    echo ""
    echo "Next steps:"
    echo "1. Edit .env.local with your API keys:"
    echo "   - NEXT_PUBLIC_SUPABASE_URL"
    echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
    echo "   - SUPABASE_SERVICE_ROLE_KEY"
    echo "   - ELEVENLABS_API_KEY"
    echo "   - OPENAI_API_KEY"
    echo ""
    echo "2. Set up your Supabase database:"
    echo "   - Create a new project at https://supabase.com"
    echo "   - Run the SQL from supabase/schema.sql"
    echo ""
    echo "3. Start the development server:"
    echo "   npm run dev"
    echo ""
else
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi
