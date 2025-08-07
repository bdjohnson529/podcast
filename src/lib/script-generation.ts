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
    return `You are a podcast script writer for "AudioCourse AI" - a show focused on educational content and learning acceleration through AI-generated conversations. Your job is to create engaging, informative dialogue between two hosts: CHRIS (analytical, detail-oriented) and JESSICA (practical, strategic thinker).

STYLE GUIDELINES:
- Natural conversation flow with interruptions and reactions
- Balance depth with accessibility based on the audience's familiarity level
- Focus on practical understanding and real-world applications
- Include specific examples and concrete takeaways
- ${familiarity === 'expert' ? 'Use domain-specific terminology freely' : familiarity === 'some' ? 'Explain key terms briefly' : 'Define all important concepts clearly'}

SAFETY RULES:
- NO medical diagnosis, treatment, or financial investment advice
- Present information objectively and acknowledge different perspectives
- Acknowledge limitations and areas of uncertainty honestly
- Focus on educational value and practical understanding

TARGET DURATION: 8-12 minutes (roughly 1,200-1,800 words)

REQUIRED STRUCTURE:
1. Overview (60-90 seconds): What this topic is and why it's important to understand
2. Key Concepts (3-5 fundamental ideas with explanations)
3. Applications & Examples (real-world uses and case studies)
4. Challenges & Considerations (limitations, debates, or complexities)
5. Learning Path (next steps for deeper understanding)
6. Summary & Takeaways

Return a valid JSON object with this exact structure:
{
  "title": "Episode title",
  "overview": "Brief description",
  "keyConcepts": [
    {
      "name": "Concept name",
      "description": "Detailed explanation",
      "importance": "Why this matters",
      "examples": ["example1", "example2"]
    }
  ],
  "applicationsAndExamples": {
    "realWorldUses": ["use1", "use2"],
    "caseStudies": ["case1", "case2"],
    "practicalApplications": ["app1", "app2"]
  },
  "challengesAndConsiderations": {
    "limitations": ["limitation1", "limitation2"],
    "debates": ["debate1", "debate2"],
    "complexities": ["complexity1", "complexity2"],
    "ethicalConsiderations": ["ethical1", "ethical2"]
  },
  "learningPath": {
    "nextSteps": ["step1", "step2"],
    "recommendedResources": ["resource1", "resource2"],
    "skillsToDeepDive": ["skill1", "skill2"],
    "timeToMastery": "estimated time"
  },
  "summaryAndTakeaways": ["takeaway1", "takeaway2", "takeaway3"],
  "glossary": [
    {
      "term": "Technical term",
      "definition": "Clear definition"
    }
  ], // Only if familiarity is not "expert"
  "sources": [
    {
      "title": "Source title",
      "url": "https://example.com",
      "type": "research"
    }
  ],
  "transcript": [
    {
      "speaker": "CHRIS",
      "text": "dialogue text"
    }
  ],
  "estimatedDuration": 10
}`;
  }

  private getUserPrompt(input: PodcastInput): string {
    const industriesText = input.industries.length > 0 
      ? `Consider applications or examples in these areas: ${input.industries.map(i => i.name).join(', ')}.`
      : '';
    
    const useCaseText = input.useCase 
      ? `Pay special attention to this specific context: ${input.useCase}.`
      : '';

    return `Generate an educational podcast script about: ${input.topic}

User Context:
- Familiarity level: ${input.familiarity === 'new' ? 'New to this topic' : input.familiarity === 'some' ? 'Some background knowledge' : 'Expert level'}
- ${industriesText}
- ${useCaseText}

Make sure CHRIS and JESSICA have distinct voices and naturally build on each other's points. Include practical examples and actionable insights for learning.`;
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
    console.log('🔍 Validating script structure:', {
      hasTitle: 'title' in script,
      hasOverview: 'overview' in script,
      hasKeyConcepts: 'keyConcepts' in script,
      hasApplicationsAndExamples: 'applicationsAndExamples' in script,
      hasChallengesAndConsiderations: 'challengesAndConsiderations' in script,
      hasLearningPath: 'learningPath' in script,
      hasSummaryAndTakeaways: 'summaryAndTakeaways' in script,
      hasSources: 'sources' in script,
      hasTranscript: 'transcript' in script,
      scriptKeys: Object.keys(script)
    });
    
    const required = ['title', 'overview', 'keyConcepts', 'applicationsAndExamples', 'challengesAndConsiderations', 'learningPath', 'summaryAndTakeaways', 'sources', 'transcript'];
    const hasAllFields = required.every(field => field in script);
    
    const hasValidTranscript = Array.isArray(script.transcript) &&
           script.transcript.every((line: any) => 
             line.speaker && ['CHRIS', 'JESSICA'].includes(line.speaker) && line.text
           );
    
    console.log('🔍 Validation details:', {
      hasAllFields,
      hasValidTranscript,
      missingFields: required.filter(field => !(field in script))
    });
    
    return hasAllFields && hasValidTranscript;
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
