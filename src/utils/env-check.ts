// Environment variable checker utility
export function checkEnvironmentVariables() {
  const requiredVars = {
    'OPENAI_API_KEY': process.env.OPENAI_API_KEY,
    'ELEVENLABS_API_KEY': process.env.ELEVENLABS_API_KEY,
    'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
    'NEXT_PUBLIC_SUPABASE_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };

  const missing = [];
  const present = [];

  for (const [key, value] of Object.entries(requiredVars)) {
    if (!value) {
      missing.push(key);
    } else {
      present.push({
        key,
        hasValue: !!value,
        length: value.length,
        preview: value.substring(0, 10) + '...'
      });
    }
  }

  console.log('🔍 Environment Variables Check:');
  console.log('✅ Present variables:', present);
  if (missing.length > 0) {
    console.error('❌ Missing variables:', missing);
  }

  return {
    allPresent: missing.length === 0,
    missing,
    present
  };
}
