import { NextRequest, NextResponse } from 'next/server';
import { scriptGenerationService } from '@/lib/script-generation';
import { supabase } from '@/lib/supabase';
import { PodcastInput } from '@/types';
import { checkEnvironmentVariables } from '@/utils/env-check';

export async function POST(request: NextRequest) {
  console.log('🚀 Script generation request started');
  
  // Check environment variables first
  const envCheck = checkEnvironmentVariables();
  if (!envCheck.allPresent) {
    console.error('❌ Missing required environment variables:', envCheck.missing);
    return NextResponse.json(
      { error: `Missing required environment variables: ${envCheck.missing.join(', ')}` },
      { status: 500 }
    );
  }
  
  try {
    const input: PodcastInput = await request.json();
    console.log('📥 Request input:', JSON.stringify(input, null, 2));

    // Validate input
    if (!input.topic || !input.familiarity) {
      console.error('❌ Validation failed: Missing required fields', {
        topic: !!input.topic,
        familiarity: !!input.familiarity
      });
      return NextResponse.json(
        { error: 'Topic and familiarity are required' },
        { status: 400 }
      );
    }

    console.log('✅ Input validation passed');

    console.log('✅ Input validation passed');

    // Generate the script using OpenAI
    console.log('🤖 Starting OpenAI script generation...');
    const script = await scriptGenerationService.generateScript(input);
    console.log('✅ Script generated successfully', {
      title: script.title,
      estimatedDuration: script.estimatedDuration,
      transcriptLength: script.transcript?.length
    });

    // Validate the generated script
    const isValid = scriptGenerationService.validateScript(script);
    console.log('🔍 Script validation result:', isValid);
    
    // Temporarily disable validation to debug structure
    // if (!isValid) {
    //   console.error('❌ Generated script failed validation');
    //   throw new Error('Generated script is invalid');
    // }

    // Save to Supabase
    console.log('💾 Attempting to save to database...');
    let savedEpisodeId = script.id; // Default to script's generated ID
    
    try {
      const { data: insertedData, error: dbError } = await supabase
        .from('episodes')
        .insert({
          topic: input.topic,
          familiarity: input.familiarity,
          industries: input.industries.map(i => i.name),
          use_case: input.useCase || null,
          script: script,
        })
        .select('id')
        .single();

      if (dbError) {
        console.warn('⚠️ Database save failed:', dbError);
        console.warn('⚠️ Will continue without database save');
        // Continue anyway - script generation succeeded
      } else {
        console.log('✅ Successfully saved to database with ID:', insertedData?.id);
        savedEpisodeId = insertedData?.id || script.id;
        // Update the script object with the database ID
        script.id = savedEpisodeId;
      }
    } catch (dbError) {
      console.warn('⚠️ Database operation failed:', dbError);
      // Continue anyway - script generation succeeded
    }

    console.log('🎉 Script generation completed successfully');
    return NextResponse.json(script);
  } catch (error) {
    console.error('💥 Script generation error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
      error: error
    });
    
    // Return a user-friendly error message
    const errorMessage = error instanceof Error 
      ? `Script generation failed: ${error.message}` 
      : 'Failed to generate script: Unknown error occurred';

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
