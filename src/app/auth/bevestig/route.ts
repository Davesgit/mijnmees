import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { ontgrendelOuder } from "@/lib/server/cookies";
import { createClient } from "@/lib/supabase/server";

// Landingsadres van links in bevestigings- en herstelmails.
// Werkt met de standaardmail van Supabase (?code=…) en met eigen mailtemplates (?token_hash=…&type=…).
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const volgende = url.searchParams.get("next") ?? "/profielen";
  const doel = volgende.startsWith("/") && !volgende.startsWith("//") ? volgende : "/profielen";

  const supabase = await createClient();
  let gebruikerId: string | null = null;

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) gebruikerId = data.user?.id ?? null;
  } else if (tokenHash && type) {
    const { data, error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) gebruikerId = data.user?.id ?? null;
  }

  if (!gebruikerId) {
    const fout = doel.startsWith("/ouder/nieuw-wachtwoord") ? "/ouder/nieuw-wachtwoord?link=ongeldig" : "/ouder/verifieer-e-mail?link=ongeldig";
    return NextResponse.redirect(new URL(fout, url.origin));
  }

  await ontgrendelOuder(gebruikerId);
  return NextResponse.redirect(new URL(doel, url.origin));
}
