import { NextRequest, NextResponse } from 'next/server';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, topic, familiarity, duration, messages } = body;

    if (action === 'initialize') {
      // Generate initial question based on topic and familiarity
      const initialMessage = generateInitialQuestion(topic, familiarity, duration);
      
      return NextResponse.json({
        message: initialMessage,
        isComplete: false,
      });
    }

    if (action === 'continue') {
      // Analyze conversation and decide next steps
      const response = await generateResponse(messages, topic, familiarity, duration);
      
      return NextResponse.json(response);
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Context chat error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateInitialQuestion(topic: string, familiarity: string, duration: number): string {
  const familiarityText = {
    'new': 'new to this topic',
    'some': 'have some background',
    'expert': 'are an expert'
  }[familiarity] || 'have some background';

  return `Great! I see you want to learn about "${topic}" and you ${familiarityText}. To create the most valuable ${duration}-minute podcast for you, I'd like to understand your specific goals better.

What's driving your interest in ${topic} right now? Are you:
- Working on a specific project or problem?
- Preparing for something (exam, presentation, job interview)?
- Just curious to learn more?
- Looking to apply this knowledge in a particular context?

Please share what's motivating your learning and any specific aspects you'd like me to focus on.`;
}

async function generateResponse(
  messages: ChatMessage[], 
  topic: string, 
  familiarity: string, 
  duration: number
): Promise<{ message: string; isComplete: boolean; context?: string }> {
  // Simple logic for now - in a real implementation, you'd use an LLM API
  const userMessages = messages.filter(m => m.role === 'user');
  const conversationLength = userMessages.length;

  // After 2-3 exchanges, complete the conversation
  if (conversationLength >= 2) {
    const context = extractContext(messages, topic);
    
    return {
      message: `Perfect! I have a much better understanding of what you're looking for. I'll now create a personalized podcast that focuses on your specific needs and interests around ${topic}. 

This should be much more targeted and valuable for your learning goals. Let's generate your custom script!`,
      isComplete: true,
      context: context,
    };
  }

  // Generate follow-up questions based on previous responses
  const lastUserMessage = userMessages[userMessages.length - 1]?.content || '';
  
  if (conversationLength === 1) {
    return {
      message: generateFollowUpQuestion(lastUserMessage, topic, familiarity),
      isComplete: false,
    };
  }

  return {
    message: "That's helpful context! Is there anything specific you'd like me to emphasize or any particular angle you'd like me to take when explaining this topic?",
    isComplete: false,
  };
}

function generateFollowUpQuestion(userResponse: string, topic: string, familiarity: string): string {
  const response = userResponse.toLowerCase();
  
  if (response.includes('project') || response.includes('work')) {
    return `That's great that you're working on a project involving ${topic}! Can you tell me more about the specific challenges you're facing or what aspects of ${topic} would be most helpful for your project? This will help me tailor the content to be immediately applicable.`;
  }
  
  if (response.includes('exam') || response.includes('test') || response.includes('interview')) {
    return `I understand you're preparing for an evaluation. What level or type of questions do you expect? Are there particular concepts, applications, or areas within ${topic} that you feel less confident about?`;
  }
  
  if (response.includes('curious') || response.includes('interest')) {
    return `I love the curiosity! Since you're exploring ${topic} out of interest, are there any specific aspects that intrigue you most? For example, are you more interested in the theoretical foundations, practical applications, current developments, or how it relates to other fields?`;
  }
  
  // Generic follow-up
  return `Thanks for sharing that context! Given your interest in ${topic}, are there any specific concepts, applications, or aspects you'd like me to prioritize? Also, is there a particular depth of explanation that would work best for you?`;
}

function extractContext(messages: ChatMessage[], topic: string): string {
  const userMessages = messages.filter(m => m.role === 'user').map(m => m.content);
  
  return `User is learning about ${topic} with the following context and goals:

${userMessages.map((msg, i) => `Response ${i + 1}: ${msg}`).join('\n\n')}

This context should be used to personalize the podcast content to the user's specific needs, interests, and application scenarios.`;
}
