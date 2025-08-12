import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  // Don't throw at import time in case build/ci doesn't have the key.
  // Route handlers will validate again and return a 500 with a helpful message.
  console.warn('OPENAI_API_KEY is not set. OpenAI-powered routes will fail until it is configured.');
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
