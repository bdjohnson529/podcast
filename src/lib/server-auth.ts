import { createClient, type User } from '@supabase/supabase-js';

// A shared Supabase service role client for privileged auth lookups
export const supabaseServiceRole = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Create a RLS-respecting user client with a bearer token
export function createUserClient(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
    }
  );
}

// Extract and validate the user from a Next.js Request using the Authorization header.
// Returns null if no valid user can be found.
export async function getAuthFromRequest(request: Request): Promise<{ user: User; token: string } | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.slice(7);
  const { data: { user }, error } = await supabaseServiceRole.auth.getUser(token);
  if (error || !user) {
    return null;
  }
  return { user, token };
}

