import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { OUDERVERKLARING_VERSIE, type Kind } from "@/lib/kinderen";
import { isOuderOntgrendeld, leesKindCookie } from "./cookies";

// Datalaag: elke toegang tot gezinsgegevens loopt via deze functies. Proxy/cookies alleen zijn nooit genoeg.

export type Ouder = { id: string; email: string; bevestigd: boolean };

/** De ingelogde ouder, gecontroleerd via de ondertekende JWT; null als niemand is ingelogd. */
export const haalOuder = cache(async (): Promise<Ouder | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;
  return {
    id: claims.sub,
    email: typeof claims.email === "string" ? claims.email : "",
    bevestigd: Boolean((claims as { email_verified?: boolean }).email_verified ?? true),
  };
});

/** Zorgt dat er een ouderrij bestaat (na de eerste bevestigde login). */
async function zorgVoorOuderRij(ouderId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("ouders").select("id").eq("id", ouderId).maybeSingle();
  if (data) return;
  const admin = createAdminClient();
  const { data: gebruiker } = await admin.auth.admin.getUserById(ouderId);
  const versie = (gebruiker.user?.user_metadata?.verklaring_versie as string | undefined) ?? OUDERVERKLARING_VERSIE;
  await admin.from("ouders").upsert({ id: ouderId, verklaring_versie: versie }, { onConflict: "id", ignoreDuplicates: true });
}

/** Vereist een ingelogde ouder; stuurt anders naar inloggen. */
export async function vereisOuder(terug?: string): Promise<Ouder> {
  const ouder = await haalOuder();
  if (!ouder) redirect(`/ouder/inloggen${terug ? `?terug=${encodeURIComponent(terug)}` : ""}`);
  await zorgVoorOuderRij(ouder.id);
  return ouder;
}

/** Vereist een ouder die recent het wachtwoord heeft ingevoerd (ouderomgeving, niet bereikbaar via profielwissel). */
export async function vereisOntgrendeldeOuder(terug: string): Promise<Ouder> {
  const ouder = await vereisOuder(terug);
  if (!(await isOuderOntgrendeld(ouder.id))) redirect(`/ouder/ontgrendel?terug=${encodeURIComponent(terug)}`);
  return ouder;
}

export async function haalKinderen(): Promise<Kind[]> {
  const ouder = await haalOuder();
  if (!ouder) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("kinderen")
    .select("id, voornaam, groep, avatar")
    .eq("ouder_id", ouder.id)
    .order("aangemaakt_op");
  return (data ?? []) as Kind[];
}

/** Een kind van de ingelogde ouder, of null (ook als het kind van een ander gezin is). */
export async function haalEigenKind(kindId: string): Promise<Kind | null> {
  const ouder = await haalOuder();
  if (!ouder || !/^[0-9a-f-]{36}$/i.test(kindId)) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("kinderen")
    .select("id, voornaam, groep, avatar")
    .eq("id", kindId)
    .eq("ouder_id", ouder.id)
    .maybeSingle();
  return (data as Kind | null) ?? null;
}

/** Het actieve kinderprofiel op dit apparaat: alleen als het bij de ingelogde ouder hoort. */
export const haalActiefKind = cache(async (): Promise<Kind | null> => {
  const kindId = await leesKindCookie();
  return kindId ? haalEigenKind(kindId) : null;
});

export async function audit(ouderId: string | null, handeling: string, objectId?: string) {
  await createAdminClient().from("audit").insert({ ouder_id: ouderId, handeling, object_id: objectId ?? null });
}
