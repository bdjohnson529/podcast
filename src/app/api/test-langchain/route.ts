import { NextRequest, NextResponse } from 'next/server';
import { scriptGenerationService } from '@/lib/script-generation';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const input = body.input

  console.log(input);

  const reply = await scriptGenerationService.testGenerateScript(input);
  
  console.log(reply);

  return NextResponse.json(
        { topic: reply },
        { status: 200 }
      );
}