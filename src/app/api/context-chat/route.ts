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
      // Generate initial question using GPT
      const initialMessage = await generateInitialQuestion(topic, familiarity, duration);
      
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

async function generateInitialQuestion(topic: string, familiarity: string, duration: number): Promise<string> {
  const familiarityText = {
    'new': 'new to this topic',
    'some': 'have some background',
    'expert': 'are an expert'
  }[familiarity] || 'have some background';

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an expert librarian who helps guide students to information about topics they are interested in.
            
The student wants to learn about "${topic}" and they ${familiarityText}. 
            
Your job is to make sure you understand specifically what the topic is that the student is inquiring about, before asking follow up questions.

Think about all the possible topics, in different disciplines, that the user could be asking about.

Ask a question that helps you clarify exactly what the user is interested in learning. Use bullet points to give examples of what the topic could be. Make it concise.`
          },
          {
            role: 'user',
            content: `Topic: ${topic}
Familiarity: ${familiarityText}
Duration: ${duration} minutes

Generate an initial question to better understand their learning needs.`
          }
        ],
        max_tokens: 200,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || getBoilerplateQuestion(topic, familiarity, duration);
    
  } catch (error) {
    console.error('Error generating initial question:', error);
    // Fallback to boilerplate if OpenAI fails
    return getBoilerplateQuestion(topic, familiarity, duration);
  }
}

function getBoilerplateQuestion(topic: string, familiarity: string, duration: number): string {
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

  // Generate follow-up question using GPT
  try {
    const followUpQuestion = await generateFollowUpQuestion(messages, topic, familiarity, duration);
    
    return {
      message: followUpQuestion,
      isComplete: false,
    };
  } catch (error) {
    console.error('Error generating follow-up question:', error);
    
    // Fallback to a simple response
    return {
      message: "That's helpful context! Is there anything specific you'd like me to emphasize or any particular angle you'd like me to take when explaining this topic?",
      isComplete: false,
    };
  }
}

async function generateFollowUpQuestion(
  messages: ChatMessage[], 
  topic: string, 
  familiarity: string, 
  duration: number
): Promise<string> {
  const conversationHistory = messages.map(m => `${m.role}: ${m.content}`).join('\n\n');
  const familiarityText = {
    'new': 'new to this topic',
    'some': 'have some background',
    'expert': 'are an expert'
  }[familiarity] || 'have some background';

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are an expert teacher preparing to create a personalized ${duration}-minute educational podcast about "${topic}" for a student who is ${familiarityText}.

Based on the conversation so far, ask ONE thoughtful follow-up question that will help you better understand:
- What specific aspects they want to focus on
- How deep to go into certain areas
- What practical applications matter most to them
- Any remaining gaps in understanding their needs

Be conversational, build on what they've already shared, and ask the most valuable question to finalize your understanding of their learning goals.

Keep your response focused and ask only ONE question.`
        },
        {
          role: 'user',
          content: `Here's our conversation so far:

${conversationHistory}

Based on their response, what's the most valuable follow-up question to ask to better understand their learning needs for this ${duration}-minute podcast about ${topic}?`
        }
      ],
      max_tokens: 150,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "That's helpful! What specific aspects of this topic would be most valuable for you to understand?";
}

function extractContext(messages: ChatMessage[], topic: string): string {
  const userMessages = messages.filter(m => m.role === 'user').map(m => m.content);
  
  return `User is learning about ${topic} with the following context and goals:

${userMessages.map((msg, i) => `Response ${i + 1}: ${msg}`).join('\n\n')}

This context should be used to personalize the podcast content to the user's specific needs, interests, and application scenarios.`;
}
