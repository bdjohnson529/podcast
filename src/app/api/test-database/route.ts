import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  console.log('🔍 Testing database connection...');
  
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('episodes')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('❌ Database connection failed:', error);
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error
      }, { status: 500 });
    }
    
    console.log('✅ Database connection successful');
    console.log('📊 Found episodes:', data?.length || 0);
    
    // Try to insert a test episode
    const testEpisode = {
      topic: 'Database Connection Test',
      familiarity: 'some' as const,
      duration: 5,
      script: {
        id: 'test-id',
        title: 'Test Episode',
        overview: 'Test overview',
        keyConcepts: [],
        applicationsAndExamples: {
          realWorldUses: [],
          caseStudies: [],
          practicalApplications: []
        },
        challengesAndConsiderations: {
          limitations: [],
          debates: [],
          complexities: [],
          ethicalConsiderations: []
        },
        summaryAndTakeaways: [],
        sources: [],
        transcript: [],
        estimatedDuration: 5,
        createdAt: new Date().toISOString()
      }
    };
    
    console.log('📝 Attempting to insert test episode...');
    const { data: insertData, error: insertError } = await supabase
      .from('episodes')
      .insert(testEpisode)
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Test episode insert failed:', insertError);
      return NextResponse.json({
        success: false,
        action: 'insert_test',
        error: insertError.message,
        details: insertError,
        existingEpisodes: data?.length || 0
      }, { status: 500 });
    }
    
    console.log('✅ Test episode inserted successfully:', insertData?.id);
    
    // Clean up - delete the test episode
    const { error: deleteError } = await supabase
      .from('episodes')
      .delete()
      .eq('id', insertData.id);
    
    if (deleteError) {
      console.warn('⚠️ Failed to clean up test episode:', deleteError);
    } else {
      console.log('🧹 Test episode cleaned up');
    }
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      existingEpisodes: data?.length || 0,
      testInsertId: insertData?.id,
      cleanedUp: !deleteError
    });
    
  } catch (error) {
    console.error('💥 Database test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 });
  }
}
