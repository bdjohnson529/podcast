import { PodcastInput, PodcastScript, DialogueLine } from '@/types';

class ScriptGenerationService {
  private apiKey: string | null = null;
  private baseUrl = 'https://api.openai.com/v1';

  private getApiKey(): string {
    if (!this.apiKey) {
      this.apiKey = process.env.OPENAI_API_KEY!;
      if (!this.apiKey) {
        throw new Error('OpenAI API key is required');
      }
    }
    return this.apiKey;
  }

  private getSystemPrompt(familiarity: string): string {
    return `You are a podcast script writer for "CommercializeCast" - a show focused on practical commercialization opportunities for AI technologies. Your job is to create engaging, informative dialogue between two hosts: CHRIS (analytical, technical) and JESSICA (business-focused, strategic).

STYLE GUIDELINES:
- Natural conversation flow with interruptions and reactions
- Balance technical depth with business practicality
- No hype or overselling - focus on realistic opportunities and challenges
- Include specific examples and real-world applications
- ${familiarity === 'expert' ? 'Use technical terminology freely' : familiarity === 'some' ? 'Explain technical terms briefly' : 'Define all technical concepts clearly'}

SAFETY RULES:
- NO medical diagnosis, treatment, or financial investment advice
- Frame everything as "commercialization opportunities" not "solutions"
- Acknowledge limitations and risks honestly
- Focus on business applications, not personal use

TARGET DURATION: 8-12 minutes (roughly 1,200-1,800 words)

REQUIRED STRUCTURE:
1. Overview (60-90 seconds): What this technology is and why it matters commercially
2. Monetization Models (3-5 different approaches with GTM strategies)
3. Moats & Risks (technical, regulatory, data, distribution challenges)
4. Build vs Buy guidance with timeline
5. 30-day action plan for getting started
6. Sources list with real URLs when possible

Return a valid JSON object with this exact structure:
{
  "title": "Episode title",
  "overview": "Brief description",
  "monetizationModels": [...],
  "moatAndRisks": {...},
  "buildVsBuy": {...},
  "firstThirtyDayPlan": [...],
  "glossary": [...] // Only if familiarity is not "expert",
  "sources": [...],
  "transcript": [...], // Array of {speaker: "CHRIS"|"JESSICA", text: "dialogue"}
  "estimatedDuration": 10
}`;
  }

  private getUserPrompt(input: PodcastInput): string {
    const industriesText = input.industries.length > 0 
      ? `Focus on these industries: ${input.industries.map(i => i.name).join(', ')}.`
      : '';
    
    const useCaseText = input.useCase 
      ? `Pay special attention to this use case: ${input.useCase}.`
      : '';

    return `Generate a podcast script about: ${input.topic}

User Context:
- Familiarity level: ${input.familiarity === 'new' ? 'New to this topic' : input.familiarity === 'some' ? 'Some background knowledge' : 'Expert level'}
- ${industriesText}
- ${useCaseText}

Make sure CHRIS and JESSICA have distinct voices and naturally build on each other's points. Include real-world examples and specific next steps.`;
  }

  async generateScript(input: PodcastInput): Promise<PodcastScript> {
    console.log('🔧 ScriptGenerationService.generateScript called with:', {
      topic: input.topic,
      familiarity: input.familiarity,
      industriesCount: input.industries.length,
      hasUseCase: !!input.useCase
    });

    try {
      // Check API key availability
      const apiKey = this.getApiKey();
      console.log('🔑 API key status:', apiKey ? 'Available' : 'Missing');

      const systemPrompt = this.getSystemPrompt(input.familiarity);
      const userPrompt = this.getUserPrompt(input);
      
      console.log('📝 Generated prompts:', {
        systemPromptLength: systemPrompt.length,
        userPromptLength: userPrompt.length
      });

      console.log('🌐 Making OpenAI API request...');
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getApiKey()}`,
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo-preview',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 4000,
        }),
      });

      console.log('📡 OpenAI API response status:', response.status);
      console.log('📡 OpenAI API response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ OpenAI API error response:', errorText);
        throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      console.log('📄 OpenAI response data structure:', {
        hasChoices: !!data.choices,
        choicesLength: data.choices?.length,
        hasUsage: !!data.usage,
        usage: data.usage
      });

      const content = data.choices[0]?.message?.content;
      console.log('📝 Generated content length:', content?.length || 0);

      if (!content) {
        console.error('❌ No content received from OpenAI');
        throw new Error('No content received from OpenAI');
      }

      console.log('🔄 Parsing JSON response...');
      console.log('📄 Raw content preview:', content.substring(0, 500) + '...');

      // Clean the content by removing markdown code blocks if present
      let cleanContent = content.trim();
      
      // Remove markdown code blocks (```json ... ``` or ``` ... ```)
      if (cleanContent.startsWith('```')) {
        // Find the first newline after opening ```
        const firstNewlineIndex = cleanContent.indexOf('\n');
        if (firstNewlineIndex !== -1) {
          // Remove the opening ``` and language identifier
          cleanContent = cleanContent.substring(firstNewlineIndex + 1);
        }
        
        // Remove closing ```
        if (cleanContent.endsWith('```')) {
          cleanContent = cleanContent.substring(0, cleanContent.lastIndexOf('```')).trim();
        }
      }

      console.log('🧹 Cleaned content preview:', cleanContent.substring(0, 500) + '...');

      // Parse the JSON response
      let parsedScript;
      try {
        parsedScript = JSON.parse(cleanContent);
        console.log('✅ JSON parsing successful');
      } catch (parseError) {
        console.error('❌ JSON parsing failed:', parseError);
        console.error('📄 Original content that failed to parse:', content);
        console.error('📄 Cleaned content that failed to parse:', cleanContent);
        throw new Error(`Failed to parse OpenAI response as JSON: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`);
      }
      
      // Add metadata
      const finalScript = {
        ...parsedScript,
        id: this.generateId(),
        createdAt: new Date().toISOString(),
      };

      console.log('🎉 Script generation completed successfully:', {
        id: finalScript.id,
        title: finalScript.title,
        hasTranscript: !!finalScript.transcript,
        transcriptLength: finalScript.transcript?.length
      });

      return finalScript;
    } catch (error) {
      console.error('💥 ScriptGenerationService error:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        type: typeof error
      });
      throw new Error(`Failed to generate script: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private generateId(): string {
    return `script_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Utility method to validate script structure
  validateScript(script: any): script is PodcastScript {
    const required = ['title', 'overview', 'monetizationModels', 'moatAndRisks', 'buildVsBuy', 'firstThirtyDayPlan', 'sources', 'transcript'];
    return required.every(field => field in script) && 
           Array.isArray(script.transcript) &&
           script.transcript.every((line: any) => 
             line.speaker && ['CHRIS', 'JESSICA'].includes(line.speaker) && line.text
           );
  }

  // Method to estimate reading time from transcript
  estimateAudioDuration(transcript: DialogueLine[]): number {
    const totalWords = transcript.reduce((acc, line) => {
      return acc + line.text.split(' ').length;
    }, 0);
    
    // Average speaking rate is about 150-160 words per minute for podcasts
    // Adding some buffer for natural pauses
    return Math.round((totalWords / 150) * 10) / 10; // Round to 1 decimal
  }
}

export const scriptGenerationService = new ScriptGenerationService();
