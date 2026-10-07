import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Supabase-client voor gebruik op de server (server components, route handlers).
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Aangeroepen vanuit een server component: cookies kunnen hier niet
            // gezet worden. Dat is prima zolang middleware de sessie ververst.
          }
        },
      },
    },
  );
}
