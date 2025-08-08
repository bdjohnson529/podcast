# Google SSO Setup Instructions

## 1. Set up Google OAuth in Google Cloud Console

### Step 1: Create a Google Cloud Project (if you don't have one)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "New Project" and create a project for your podcast app
3. Make note of your project ID

### Step 2: Enable Google+ API
1. In your Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Google+ API" and enable it

### Step 3: Create OAuth 2.0 Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. If prompted, configure the OAuth consent screen first:
   - User Type: External (for testing) or Internal (for organization use)
   - App name: "AudioCourse AI" (or your preferred name)
   - User support email: Your email
   - App logo: Optional
   - App domain: Your domain (can be localhost for development)
   - Developer contact information: Your email
4. For Application type, select "Web application"
5. Set authorized redirect URIs:
   - For development: `http://localhost:3000/auth/callback`
   - For production: `https://yourdomain.com/auth/callback`
   - **Important**: Also add your Supabase auth callback:
     - `https://[your-supabase-project].supabase.co/auth/v1/callback`

### Step 4: Get your credentials
1. After creating, you'll get a Client ID and Client Secret
2. Copy these values - you'll need them for Supabase

## 2. Configure Supabase Authentication

### Step 1: Go to Supabase Dashboard
1. Open your Supabase project dashboard
2. Go to "Authentication" > "Providers"
3. Find "Google" in the list and click to configure

### Step 2: Configure Google Provider
1. Enable the Google provider
2. Enter your Google OAuth Client ID
3. Enter your Google OAuth Client Secret
4. Click "Save"

### Step 3: Set Site URL
1. Go to "Authentication" > "Settings" > "General"
2. Set your Site URL:
   - Development: `http://localhost:3000`
   - Production: `https://yourdomain.com`
3. Add additional redirect URLs if needed

## 3. Update Environment Variables

Add these to your `.env.local` file (if not already present):

```bash
# Supabase (should already be configured)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional: Google OAuth credentials (for direct use, not needed with Supabase)
# GOOGLE_CLIENT_ID=your-google-client-id
# GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## 4. Create Database Tables

Run the SQL script in `database_schema_with_auth.sql` in your Supabase SQL Editor to:
1. Create the episodes table with proper schema
2. Set up Row Level Security policies for both authenticated and anonymous users
3. Create necessary indexes and triggers

## 5. Test the Setup

1. Start your development server: `npm run dev`
2. Go to `http://localhost:3000`
3. Click "Sign in with Google" in the top right
4. You should be redirected to Google OAuth flow
5. After successful authentication, you should see your profile in the header
6. Generate a podcast episode to test database saving with user association

## 6. Verify Database Integration

After signing in and generating an episode:
1. Go to Supabase Dashboard > "Table Editor" > "episodes"
2. You should see the episode with a `user_id` field populated
3. The episode should only be visible to the user who created it (due to RLS policies)

## Troubleshooting

### Common Issues:

1. **"Invalid redirect URI"**
   - Make sure the redirect URI in Google Cloud Console exactly matches your Supabase auth callback URL
   - Check for typos in the URL

2. **"Error getting user session"**
   - Verify your Supabase environment variables are correct
   - Check that the Google provider is enabled in Supabase

3. **Database permission errors**
   - Make sure you've run the database schema script
   - Verify RLS policies are set up correctly

4. **Episodes not saving to database**
   - Check the browser console for error messages
   - Verify the episodes table exists in Supabase
   - Check that the API is receiving the auth token correctly
