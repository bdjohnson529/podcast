import { NextRequest, NextResponse } from 'next/server';
import { SupabaseAudioStorage } from '@/lib/supabase-storage';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Initializing Supabase Storage bucket...');
    
    // Use server client with service role key for admin operations
    const { createServerClient } = await import('@/lib/supabase');
    const serverSupabase = createServerClient();
    console.log('📡 Server Supabase client loaded');
    
    // Test basic connection with server client
    console.log('🔗 Testing Supabase connection with service role...');
    const { data: testData, error: testError } = await serverSupabase.storage.listBuckets();
    
    if (testError) {
      console.error('❌ Supabase connection test failed:', testError);
      return NextResponse.json({
        error: 'Supabase connection failed',
        details: testError.message,
        hint: 'Check your SUPABASE_SERVICE_ROLE_KEY environment variable'
      }, { status: 500 });
    }
    
    console.log('✅ Supabase connection successful. Existing buckets:', testData?.map(b => b.name));
    
    // Check if bucket already exists
    const bucketExists = testData?.some(bucket => bucket.name === 'podcast-audio');
    
    if (bucketExists) {
      console.log('✅ Audio bucket already exists');
      return NextResponse.json({ 
        message: 'Audio storage bucket already exists',
        bucket: 'podcast-audio',
        existingBuckets: testData?.map(b => b.name) || []
      });
    }
    
    // Create the bucket
    console.log('📦 Creating podcast-audio bucket...');
    const { error: createError } = await serverSupabase.storage.createBucket('podcast-audio', {
      public: true,
      fileSizeLimit: 50 * 1024 * 1024, // 50MB limit (reduced from 100MB)
      allowedMimeTypes: ['audio/mpeg', 'audio/mp3', 'audio/wav']
    });
    
    if (createError) {
      console.error('❌ Bucket creation error:', createError);
      return NextResponse.json({
        error: 'Failed to create storage bucket',
        details: createError.message,
        supabaseError: createError
      }, { status: 500 });
    }
    
    console.log('✅ Bucket created successfully');
    
    return NextResponse.json({ 
      message: 'Audio storage bucket created successfully',
      bucket: 'podcast-audio'
    });
    
  } catch (error) {
    console.error('💥 Bucket initialization error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to initialize storage bucket',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
