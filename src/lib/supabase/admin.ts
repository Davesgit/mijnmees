import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Supabase-client met de geheime serversleutel. Omzeilt RLS.
 * Alleen gebruiken ná een eigendomscontrole in de datalaag (src/lib/server/dal.ts).
 */
export function createAdminClient() {
  const sleutel = process.env.SUPABASE_SECRET_KEY;
  if (!sleutel) throw new Error("SUPABASE_SECRET_KEY ontbreekt.");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, sleutel, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
