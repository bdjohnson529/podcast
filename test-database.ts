import { supabase } from '@/lib/supabase';

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...');
  
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('episodes')
      .select('count(*)')
      .limit(1);
    
    if (error) {
      console.error('❌ Database connection failed:', error);
      return false;
    }
    
    console.log('✅ Database connection successful');
    console.log('📊 Episodes count result:', data);
    
    // Try to insert a test episode
    const testEpisode = {
      topic: 'Database Connection Test',
      familiarity: 'some' as const,
      duration: 5,
      industries: ['Technology'],
      use_case: 'Testing database functionality',
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
        learningPath: {
          nextSteps: [],
          recommendedResources: [],
          skillsToDeepDive: [],
          timeToMastery: 'test'
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
      console.error('📄 Error details:', {
        message: insertError.message,
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint
      });
      return false;
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
    
    return true;
    
  } catch (error) {
    console.error('💥 Database test failed:', error);
    return false;
  }
}

export default testDatabaseConnection;
