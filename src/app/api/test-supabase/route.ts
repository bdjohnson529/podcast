import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing Supabase connection...');
    
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    console.log('🔧 Environment check:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
      urlLength: supabaseUrl?.length || 0,
      keyLength: supabaseAnonKey?.length || 0
    });
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({
        error: 'Missing Supabase environment variables',
        env: {
          hasUrl: !!supabaseUrl,
          hasKey: !!supabaseAnonKey
        }
      }, { status: 500 });
    }
    
    // Test basic connection with a simple query
    console.log('📡 Testing storage access...');
    const { data, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('❌ Storage test failed:', error);
      return NextResponse.json({
        error: 'Supabase storage access failed',
        details: error.message,
        supabaseError: error
      }, { status: 500 });
    }
    
    console.log('✅ Storage test successful');
    
    return NextResponse.json({
      success: true,
      message: 'Supabase connection working',
      buckets: data?.map(b => b.name) || [],
      env: {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseAnonKey,
        urlPreview: supabaseUrl.substring(0, 20) + '...'
      }
    });
    
  } catch (error) {
    console.error('💥 Connection test failed:', error);
    return NextResponse.json({
      error: 'Connection test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
