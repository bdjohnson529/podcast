import { NextRequest, NextResponse } from 'next/server';
import { checkEnvironmentVariables } from '@/utils/env-check';

export async function GET() {
  console.log('🔍 Debug endpoint called');
  
  const envCheck = checkEnvironmentVariables();
  
  // Test OpenAI connection
  let openaiTest: { status: string; error: string | null } = { status: 'unknown', error: null };
  try {
    if (process.env.OPENAI_API_KEY) {
      console.log('🤖 Testing OpenAI connection...');
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      });
      
      openaiTest = {
        status: response.ok ? 'connected' : 'failed',
        error: response.ok ? null : `HTTP ${response.status}: ${response.statusText}`,
      };
    } else {
      openaiTest = { status: 'no-key', error: 'No API key provided' };
    }
  } catch (error) {
    openaiTest = {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  // Test ElevenLabs connection
  let elevenlabsTest: { status: string; error: string | null } = { status: 'unknown', error: null };
  try {
    if (process.env.ELEVENLABS_API_KEY) {
      console.log('🎤 Testing ElevenLabs connection...');
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
        },
      });
      
      elevenlabsTest = {
        status: response.ok ? 'connected' : 'failed',
        error: response.ok ? null : `HTTP ${response.status}: ${response.statusText}`,
      };
    } else {
      elevenlabsTest = { status: 'no-key', error: 'No API key provided' };
    }
  } catch (error) {
    elevenlabsTest = {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  const debugInfo = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    environmentVariables: envCheck,
    apiTests: {
      openai: openaiTest,
      elevenlabs: elevenlabsTest,
    },
    nodeVersion: process.version,
  };

  console.log('📊 Debug info compiled:', debugInfo);

  return NextResponse.json(debugInfo);
}
