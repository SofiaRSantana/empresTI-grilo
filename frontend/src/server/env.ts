import { z } from "zod";

const supabaseConfiguration = z.object({
  url: z.url(),
  key: z.string().min(1),
});

export function getSupabaseConfiguration() {
  return supabaseConfiguration.parse({
    url: process.env.NEXT_PUBLIC_SUPABASE_API_URL,
    key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
}
