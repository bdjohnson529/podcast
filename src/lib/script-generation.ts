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

  private getSystemPrompt(familiarity: string, targetDuration: number): string {
    // Calculate approximate word count based on target duration
    // Average speaking rate is about 150 words per minute for podcasts
    const targetWords = Math.round(targetDuration * 150);
    const wordRange = `${Math.round(targetWords * 0.8)}-${Math.round(targetWords * 1.2)}`;
    
    return `You are a podcast script writer for "AudioCourse AI" - a show focused on educational content and learning acceleration through AI-generated conversations. Your job is to create engaging, informative dialogue between two hosts: CHRIS (analytical, detail-oriented) and JESSICA (practical, strategic thinker).

You must respond with a valid JSON object containing the podcast script data.

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

TARGET DURATION: ${targetDuration} minute${targetDuration !== 1 ? 's' : ''} (roughly ${wordRange} words)
${targetDuration <= 3 ? 'BRIEF FORMAT: Focus on core concepts and key takeaways only.' : 
  targetDuration <= 8 ? 'STANDARD FORMAT: Cover key concepts with examples and practical applications.' :
  'DETAILED FORMAT: Include comprehensive coverage with multiple examples, case studies, and detailed explanations.'}

REQUIRED STRUCTURE:
1. Overview (${targetDuration <= 3 ? '30-45' : targetDuration <= 8 ? '60-90' : '90-120'} seconds): What this topic is and why it's important to understand
2. Key Concepts (${targetDuration <= 3 ? '2-3' : targetDuration <= 8 ? '3-5' : '4-6'} fundamental ideas with explanations)
3. Applications & Examples (real-world uses and case studies)
4. Challenges & Considerations (limitations, debates, or complexities)
5. Learning Path (next steps for deeper understanding)
6. Summary & Takeaways

Return a valid JSON object with this exact structure (NO markdown formatting, NO code blocks, ONLY pure JSON):
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
  ],
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
  "estimatedDuration": ${targetDuration}
}

IMPORTANT: 
- Return ONLY the JSON object, no explanatory text
- Do NOT wrap in markdown code blocks
- Ensure all strings are properly escaped
- No trailing commas
- Valid JSON syntax only`;
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
- Target duration: ${input.duration} minute${input.duration !== 1 ? 's' : ''}
- ${industriesText}
- ${useCaseText}

Make sure CHRIS and JESSICA have distinct voices and naturally build on each other's points. Include practical examples and actionable insights for learning. Adjust the depth and number of examples based on the target duration - shorter episodes should focus on core concepts, while longer episodes can explore more examples and nuances.`;
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

      const systemPrompt = this.getSystemPrompt(input.familiarity, input.duration);
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
          response_format: { type: "json_object" }
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

      // Robust JSON extraction and cleaning
      let cleanContent = this.extractAndCleanJSON(content);

      console.log('🧹 Cleaned content preview:', cleanContent.substring(0, 500) + '...');

      // Parse the JSON response
      let parsedScript;
      try {
        parsedScript = JSON.parse(cleanContent);
        console.log('✅ JSON parsing successful');
      } catch (parseError) {
        console.error('❌ JSON parsing failed:', parseError);
        console.error('📄 Error position info:', {
          message: parseError instanceof Error ? parseError.message : 'Unknown error',
          position: parseError instanceof SyntaxError ? parseError.message.match(/position (\d+)/) : null
        });
        
        // Log the problematic area around the error position
        if (parseError instanceof SyntaxError && parseError.message.includes('position')) {
          const positionMatch = parseError.message.match(/position (\d+)/);
          if (positionMatch) {
            const position = parseInt(positionMatch[1]);
            const start = Math.max(0, position - 100);
            const end = Math.min(cleanContent.length, position + 100);
            console.error('� Content around error position:', {
              before: cleanContent.substring(start, position),
              errorChar: cleanContent.charAt(position),
              after: cleanContent.substring(position + 1, end)
            });
          }
        }
        
        console.error('📄 Original content length:', content.length);
        console.error('📄 Cleaned content length:', cleanContent.length);
        
        // Try additional fallback cleaning methods
        console.log('🔄 Trying fallback JSON extraction...');
        const fallbackContent = this.fallbackJSONExtraction(content);
        try {
          parsedScript = JSON.parse(fallbackContent);
          console.log('✅ Fallback JSON parsing successful');
        } catch (fallbackError) {
          console.error('❌ Fallback parsing also failed:', fallbackError);
          // One more attempt with even more aggressive cleaning
          console.log('🔄 Trying desperate JSON cleaning...');
          const desperateClean = this.desperateJSONClean(content);
          try {
            parsedScript = JSON.parse(desperateClean);
            console.log('✅ Desperate cleaning successful');
          } catch (finalError) {
            console.error('❌ All parsing attempts failed');
            console.error('📄 Final cleaned content sample:', desperateClean.substring(0, 1000));
            throw new Error(`Failed to parse OpenAI response as JSON: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`);
          }
        }
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

  // Robust JSON extraction from OpenAI response
  private extractAndCleanJSON(content: string): string {
    let cleanContent = content.trim();
    
    // Remove markdown code blocks (```json ... ``` or ``` ... ```)
    if (cleanContent.includes('```')) {
      // Try to find JSON code block first
      const jsonBlockMatch = cleanContent.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      if (jsonBlockMatch) {
        cleanContent = jsonBlockMatch[1].trim();
      } else {
        // Fallback: remove all ``` blocks
        cleanContent = cleanContent.replace(/```[\s\S]*?```/g, '').trim();
      }
    }
    
    // Remove any leading/trailing non-JSON text
    const jsonStart = cleanContent.indexOf('{');
    const jsonEnd = cleanContent.lastIndexOf('}');
    
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      cleanContent = cleanContent.substring(jsonStart, jsonEnd + 1);
    }
    
    // Fix common JSON issues
    cleanContent = this.fixCommonJSONIssues(cleanContent);
    
    return cleanContent;
  }

  // Fallback JSON extraction method
  private fallbackJSONExtraction(content: string): string {
    let cleanContent = content.trim();
    
    // More aggressive cleaning
    // Remove everything before the first {
    const firstBrace = cleanContent.indexOf('{');
    if (firstBrace > 0) {
      cleanContent = cleanContent.substring(firstBrace);
    }
    
    // Remove everything after the last }
    const lastBrace = cleanContent.lastIndexOf('}');
    if (lastBrace !== -1) {
      cleanContent = cleanContent.substring(0, lastBrace + 1);
    }
    
    // Fix common issues
    cleanContent = this.fixCommonJSONIssues(cleanContent);
    
    return cleanContent;
  }

  // Fix common JSON formatting issues
  private fixCommonJSONIssues(jsonString: string): string {
    let fixed = jsonString;
    
    // Remove trailing commas before closing braces/brackets
    fixed = fixed.replace(/,(\s*[}\]])/g, '$1');
    
    // Fix the specific issue where words appear before property names in objects
    // Pattern: {word "property": becomes {"property":
    fixed = fixed.replace(/\{\s*\w+\s+"([^"]+)":/g, '{"$1":');
    
    // Fix unescaped quotes in strings (basic attempt)
    // This is a simple fix and might not catch all cases
    fixed = fixed.replace(/"([^"]*)"([^"]*)"([^"]*?)"/g, (match, p1, p2, p3) => {
      if (p2.includes(':') || p2.includes(',')) {
        return match; // Don't fix if it looks like proper JSON structure
      }
      return `"${p1}\\"${p2}\\"${p3}"`;
    });
    
    // Remove any control characters that might break JSON
    fixed = fixed.replace(/[\x00-\x1F\x7F]/g, '');
    
    return fixed;
  }

  // Last resort JSON cleaning
  private desperateJSONClean(content: string): string {
    let clean = content.trim();
    
    // Remove everything before the first { and after the last }
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    
    if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
      throw new Error('No valid JSON structure found');
    }
    
    clean = clean.substring(firstBrace, lastBrace + 1);
    
    // Remove all markdown artifacts
    clean = clean.replace(/```[\s\S]*?```/g, '');
    clean = clean.replace(/```/g, '');
    
    // Fix the specific "last" issue and similar problems
    clean = clean.replace(/\{\s*\w+\s+"([^"]+)":/g, '{"$1":');
    
    // Fix multiple common issues
    clean = clean.replace(/,(\s*[}\]])/g, '$1'); // trailing commas
    clean = clean.replace(/([}\]]),(\s*[}\]])/g, '$1$2'); // double commas
    clean = clean.replace(/\n/g, ' '); // newlines to spaces
    clean = clean.replace(/\r/g, ''); // remove carriage returns
    clean = clean.replace(/\t/g, ' '); // tabs to spaces
    clean = clean.replace(/\s+/g, ' '); // multiple spaces to single
    
    // Try to fix unclosed strings (very basic)
    const quoteCount = (clean.match(/"/g) || []).length;
    if (quoteCount % 2 !== 0) {
      console.warn('⚠️ Odd number of quotes detected, attempting to fix...');
      // This is a very basic fix - not foolproof
      clean = clean + '"';
    }
    
    return clean.trim();
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
