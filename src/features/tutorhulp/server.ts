import "server-only";
import { z } from "zod";
import type { Poging, Sessie } from "@/features/oefenen/types";
import { opgaveTekst, vindVraag, antwoordTekst } from "@/features/oefenen/vragen";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Tutor } from "@/lib/server/rollen";
import { haalVoortgang, naarPoging, naarSessie } from "@/lib/server/voortgang";
import { BORD, bordLimieten, type BordOpname } from "./bord";
import { beoordeelTutorhulp, controleUitkomst, tutorCriteria, type HulpBewijs } from "./criteria";

// Datalaag voor tutorhulp. Tutor- en kindweergaven gebruiken de serversleutel, maar alleen na een expliciete
// controle hieronder, en geven alleen de velden terug die op het scherm nodig zijn (allowlist).

export const AUDIO_BUCKET = "uitleg-audio";

export type HulpvraagStatus = "nieuw" | "in-behandeling" | "uitleg-verstuurd" | "afgerond";

export type Hulpvraag = {
  id: string;
  kindId: string;
  leerdoelId: string;
  status: HulpvraagStatus;
  tutorId: string | null;
  uitlegId: string | null;
  controleVraagId: string | null;
  aangemaaktOp: string;
  afgerondOp: string | null;
  afsluitreden: string | null;
  bewijs: HulpBewijs;
  claimTot: string | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const naarHulpvraag = (r: any): Hulpvraag => ({
  id: r.id,
  kindId: r.kind_id,
  leerdoelId: r.leerdoel_id,
  status: r.status,
  tutorId: r.tutor_id,
  uitlegId: r.uitleg_id,
  controleVraagId: r.controle_vraag_id,
  aangemaaktOp: r.aangemaakt_op,
  afgerondOp: r.afgerond_op,
  afsluitreden: r.afsluitreden,
  bewijs: r.bewijs,
  claimTot: r.claim_tot,
});

const HULPVRAAG_VELDEN = "id, kind_id, leerdoel_id, status, tutor_id, uitleg_id, controle_vraag_id, aangemaakt_op, afgerond_op, afsluitreden, bewijs, claim_tot";

/* ---------- Bordvalidatie ---------- */

const x = z.number().min(0).max(BORD.breedte);
const y = z.number().min(0).max(BORD.hoogte);
const basis = { id: z.string().min(1).max(20), kleur: z.enum(["inkt", "blauw", "oranje", "groen"]) };
const elementSchema = z.discriminatedUnion("soort", [
  z.object({ ...basis, soort: z.literal("tekst"), x, y, tekst: z.string().min(1).max(bordLimieten.tekst), groot: z.boolean() }),
  z.object({ ...basis, soort: z.literal("breuk"), x, y, teller: z.string().min(1).max(6), noemer: z.string().min(1).max(6) }),
  z.object({ ...basis, soort: z.literal("rechthoek"), x, y, b: z.number().min(4).max(BORD.breedte), h: z.number().min(4).max(BORD.hoogte), delen: z.number().int().min(1).max(24), gevuld: z.number().int().min(0).max(24) }),
  z.object({ ...basis, soort: z.literal("cirkel"), x, y, r: z.number().min(4).max(400), delen: z.number().int().min(1).max(24), gevuld: z.number().int().min(0).max(24) }),
  z.object({ ...basis, soort: z.literal("pijl"), x1: x, y1: y, x2: x, y2: y }),
  z.object({ ...basis, soort: z.literal("pen"), punten: z.array(z.tuple([x, y])).min(1).max(bordLimieten.penPunten) }),
]);
const t = z.number().min(0).max(900_000);
export const bordSchema = z.object({
  elementen: z.array(elementSchema).max(bordLimieten.elementen),
  gebeurtenissen: z
    .array(
      z.discriminatedUnion("op", [
        z.object({ t, op: z.literal("plaats"), element: elementSchema }),
        z.object({ t, op: z.literal("verwijder"), id: z.string().max(20) }),
        z.object({ t, op: z.literal("zet"), elementen: z.array(elementSchema).max(bordLimieten.elementen) }),
      ]),
    )
    .max(bordLimieten.gebeurtenissen),
});

/* ---------- Ouder en kind (eigen gezin) ---------- */

/** Geschiktheid op basis van de gesynchroniseerde voortgang (niet wat het apparaat zegt). */
export async function geschiktheidVoorKind(kindId: string, leerdoelId: string) {
  const voortgang = await haalVoortgang(kindId);
  if (!voortgang) return null;
  return beoordeelTutorhulp({ sessies: Object.values(voortgang.sessies), pogingen: voortgang.pogingen }, leerdoelId);
}

/** Meldingen en hulpvragen van het eigen gezin (RLS: alleen eigen rijen). */
export async function haalHulpVanGezin(kindId?: string) {
  const supabase = await createClient();
  let meldingen = supabase.from("oudermeldingen").select("id, kind_id, leerdoel_id, aangemaakt_op").is("afgehandeld_op", null).order("aangemaakt_op", { ascending: false });
  let vragen = supabase.from("hulpvragen").select(HULPVRAAG_VELDEN).order("aangemaakt_op", { ascending: false }).limit(20);
  if (kindId) {
    meldingen = meldingen.eq("kind_id", kindId);
    vragen = vragen.eq("kind_id", kindId);
  }
  const [m, v] = await Promise.all([meldingen, vragen]);
  return {
    meldingen: (m.data ?? []).map((r) => ({ id: r.id as string, kindId: r.kind_id as string, leerdoelId: r.leerdoel_id as string, aangemaaktOp: r.aangemaakt_op as string })),
    hulpvragen: (v.data ?? []).map(naarHulpvraag),
  };
}

/** Lopende hulpvragen en die van de laatste twee weken. */
export function recenteHulpvragen(hulpvragen: Hulpvraag[], nu = Date.now()) {
  return hulpvragen.filter((h) => h.status !== "afgerond" || (h.afgerondOp && nu - Date.parse(h.afgerondOp) < 14 * 86_400_000));
}

/** Hulpvraag van het actieve kind (kind-apparaat valt onder de oudersessie + kindcookie). */
export async function haalHulpvraagVanKind(kindId: string, hulpvraagId: string): Promise<Hulpvraag | null> {
  if (!/^[0-9a-f-]{36}$/i.test(hulpvraagId)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("hulpvragen").select(HULPVRAAG_VELDEN).eq("id", hulpvraagId).eq("kind_id", kindId).maybeSingle();
  return data ? naarHulpvraag(data) : null;
}

export type UitlegVoorSpeler = {
  id: string;
  titel: string;
  leerdoelId: string;
  bord: BordOpname;
  duurMs: number;
  transcript: string;
  audioUrl: string | null;
  tutorVoornaam: string;
};

async function speelbareUitleg(uitlegId: string): Promise<UitlegVoorSpeler | null> {
  const db = createAdminClient();
  const { data } = await db.from("uitleg").select("id, titel, leerdoel_id, bord, duur_ms, transcript, audio_pad, tutor_id, status").eq("id", uitlegId).maybeSingle();
  if (!data) return null;
  const { data: tutor } = await db.from("tutors").select("voornaam").eq("id", data.tutor_id).maybeSingle();
  let audioUrl: string | null = null;
  if (data.audio_pad) {
    const { data: link } = await db.storage.from(AUDIO_BUCKET).createSignedUrl(data.audio_pad, 60 * 60);
    audioUrl = link?.signedUrl ?? null;
  }
  return {
    id: data.id,
    titel: data.titel,
    leerdoelId: data.leerdoel_id,
    bord: data.bord as BordOpname,
    duurMs: data.duur_ms ?? 0,
    transcript: data.transcript,
    audioUrl,
    tutorVoornaam: (tutor?.voornaam as string | undefined) ?? "je tutor",
  };
}

/** Kind ziet alleen gepubliceerde uitleg die aan een eigen hulpvraag gekoppeld is. */
export async function uitlegVoorKind(kindId: string, uitlegId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(uitlegId)) return null;
  const supabase = await createClient();
  const { data: hulp } = await supabase
    .from("hulpvragen")
    .select(HULPVRAAG_VELDEN)
    .eq("kind_id", kindId)
    .eq("uitleg_id", uitlegId)
    .order("aangemaakt_op", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!hulp) return null;
  const uitleg = await speelbareUitleg(uitlegId);
  if (!uitleg) return null;
  const { data: status } = await createAdminClient().from("uitleg").select("status").eq("id", uitlegId).single();
  if (status?.status !== "gepubliceerd") return null;
  return { uitleg, hulpvraag: naarHulpvraag(hulp) };
}

/* ---------- Tutor ---------- */

export type WerkvoorraadItem = { id: string; leerdoelId: string; status: HulpvraagStatus; groep: number; aangemaaktOp: string; vanMij: boolean; dagen: number };

/** Werkvoorraad: open hulpvragen (zonder naam) en de eigen opgepakte. */
export async function haalWerkvoorraad(tutor: Tutor): Promise<WerkvoorraadItem[]> {
  const db = createAdminClient();
  const nu = new Date().toISOString();
  const { data } = await db
    .from("hulpvragen")
    .select("id, leerdoel_id, status, tutor_id, claim_tot, aangemaakt_op, bewijs, kinderen(groep)")
    .or(`status.eq.nieuw,tutor_id.eq.${tutor.id},and(status.eq.in-behandeling,claim_tot.lt.${nu})`)
    .order("aangemaakt_op")
    .limit(100);
  return (data ?? []).map((r) => ({
    id: r.id,
    leerdoelId: r.leerdoel_id,
    status: r.status as HulpvraagStatus,
    groep: (r.kinderen as unknown as { groep: number } | null)?.groep ?? 0,
    aangemaaktOp: r.aangemaakt_op,
    vanMij: r.tutor_id === tutor.id,
    dagen: ((r.bewijs as HulpBewijs | null)?.dagen ?? []).length,
  }));
}

/** Atomair oppakken: lukt alleen als niemand anders hem (nog geldig) heeft. */
export async function claimHulpvraag(tutor: Tutor, hulpvraagId: string): Promise<"geclaimd" | "al-van-jou" | "bezet"> {
  const db = createAdminClient();
  const nu = new Date();
  const tot = new Date(nu.getTime() + tutorCriteria.claimDagen * 86_400_000).toISOString();
  const { data } = await db
    .from("hulpvragen")
    .update({ status: "in-behandeling", tutor_id: tutor.id, geclaimd_op: nu.toISOString(), claim_tot: tot })
    .eq("id", hulpvraagId)
    .or(`status.eq.nieuw,and(status.eq.in-behandeling,claim_tot.lt.${nu.toISOString()})`)
    .select("id");
  if (data?.length) return "geclaimd";
  const { data: huidig } = await db.from("hulpvragen").select("tutor_id").eq("id", hulpvraagId).maybeSingle();
  return huidig?.tutor_id === tutor.id ? "al-van-jou" : "bezet";
}

export type DossierPoging = { op: string; opgave: string; antwoord: string; goedAntwoord: string; resultaat: "goed" | "fout"; hints: number; uitleg: boolean; vervolg: boolean };

export type Dossier = {
  hulpvraag: Hulpvraag;
  kind: { voornaam: string; groep: number };
  pogingen: DossierPoging[];
  uitleg: { id: string; titel: string; status: "concept" | "gepubliceerd" } | null;
  controle: ReturnType<typeof controleUitkomst>;
  controleOpgave: string | null;
};

async function kindData(kindId: string, leerdoelId: string): Promise<{ sessies: Sessie[]; pogingen: Poging[] }> {
  const db = createAdminClient();
  const vanaf = new Date(Date.now() - 60 * 86_400_000).toISOString();
  const [s, p] = await Promise.all([
    db.from("sessies").select("*").eq("kind_id", kindId).gte("gestart_op", vanaf).order("gestart_op").limit(200),
    db.from("pogingen").select("*").eq("kind_id", kindId).eq("leerdoel_id", leerdoelId).gte("op", vanaf).order("op").limit(500),
  ]);
  return { sessies: (s.data ?? []).map(naarSessie), pogingen: (p.data ?? []).map(naarPoging) };
}

/** Alleen de tutor die de hulpvraag heeft opgepakt ziet het dossier: voornaam, groep en oefencontext. */
export async function haalDossier(tutor: Tutor, hulpvraagId: string): Promise<Dossier | null> {
  if (!/^[0-9a-f-]{36}$/i.test(hulpvraagId)) return null;
  const db = createAdminClient();
  const { data } = await db.from("hulpvragen").select(HULPVRAAG_VELDEN).eq("id", hulpvraagId).maybeSingle();
  if (!data || data.tutor_id !== tutor.id) return null;
  const hulpvraag = naarHulpvraag(data);
  const [{ data: kind }, gegevens, { data: uitleg }] = await Promise.all([
    db.from("kinderen").select("voornaam, groep").eq("id", hulpvraag.kindId).single(),
    kindData(hulpvraag.kindId, hulpvraag.leerdoelId),
    hulpvraag.uitlegId ? db.from("uitleg").select("id, titel, status").eq("id", hulpvraag.uitlegId).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  if (!kind) return null;
  const slots = new Map(gegevens.sessies.flatMap((s) => s.slots.map((sl) => [`${s.id}:${sl.id}`, { sl, soort: s.soort }] as const)));
  const pogingen = gegevens.pogingen
    .filter((p) => slots.get(`${p.sessieId}:${p.slotId}`)?.soort !== "controle")
    .slice(-40)
    .map((p): DossierPoging => {
      const vraag = vindVraag(p.vraagId);
      return {
        op: p.op,
        opgave: vraag ? opgaveTekst(vraag) : p.vraagId,
        antwoord: antwoordTekst(vraag, p.antwoord),
        goedAntwoord: vraag && vraag.soort !== "europa" ? String(vraag.answer) : "",
        resultaat: p.resultaat,
        hints: p.hulpVooraf.hints,
        uitleg: p.hulpVooraf.uitleg,
        vervolg: Boolean(slots.get(`${p.sessieId}:${p.slotId}`)?.sl.herhalingVan),
      };
    });
  const controleVraag = hulpvraag.controleVraagId ? vindVraag(hulpvraag.controleVraagId) : null;
  return {
    hulpvraag,
    kind: { voornaam: kind.voornaam, groep: kind.groep },
    pogingen,
    uitleg: uitleg ? { id: uitleg.id, titel: uitleg.titel, status: uitleg.status } : null,
    controle: hulpvraag.controleVraagId ? controleUitkomst(gegevens.sessies, gegevens.pogingen, hulpvraag.id, hulpvraag.controleVraagId) : null,
    controleOpgave: controleVraag ? opgaveTekst(controleVraag) : null,
  };
}

export async function gezienDoorKind(kindId: string, leerdoelId: string) {
  const { pogingen } = await kindData(kindId, leerdoelId);
  return new Set(pogingen.map((p) => p.vraagId));
}

export type UitlegRij = {
  id: string;
  tutorId: string;
  leerdoelId: string;
  hulpvraagId: string | null;
  titel: string;
  bord: BordOpname;
  audioPad: string | null;
  duurMs: number | null;
  transcript: string;
  status: "concept" | "gepubliceerd";
  privacyGecontroleerd: boolean;
  bijgewerktOp: string;
};

/** Eigen uitleg van de tutor (concept of gepubliceerd). */
export async function haalEigenUitleg(tutor: Tutor, uitlegId: string): Promise<UitlegRij | null> {
  if (!/^[0-9a-f-]{36}$/i.test(uitlegId)) return null;
  const { data } = await createAdminClient()
    .from("uitleg")
    .select("id, tutor_id, leerdoel_id, hulpvraag_id, titel, bord, audio_pad, duur_ms, transcript, status, privacy_gecontroleerd, bijgewerkt_op")
    .eq("id", uitlegId)
    .eq("tutor_id", tutor.id)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    tutorId: data.tutor_id,
    leerdoelId: data.leerdoel_id,
    hulpvraagId: data.hulpvraag_id,
    titel: data.titel,
    bord: data.bord as BordOpname,
    audioPad: data.audio_pad,
    duurMs: data.duur_ms,
    transcript: data.transcript,
    status: data.status,
    privacyGecontroleerd: data.privacy_gecontroleerd,
    bijgewerktOp: data.bijgewerkt_op,
  };
}

/** Voorbeeld voor de tutor zelf (eigen uitleg, ook als concept). */
export async function uitlegVoorTutor(tutor: Tutor, uitlegId: string) {
  const eigen = await haalEigenUitleg(tutor, uitlegId);
  if (!eigen) return null;
  return speelbareUitleg(uitlegId);
}

/** Bibliotheek: eigen uitleg en gepubliceerde uitleg van andere tutors. */
export async function haalBibliotheek(tutor: Tutor) {
  const { data } = await createAdminClient()
    .from("uitleg")
    .select("id, tutor_id, leerdoel_id, titel, status, duur_ms, bijgewerkt_op, gepubliceerd_op")
    .or(`tutor_id.eq.${tutor.id},status.eq.gepubliceerd`)
    .order("bijgewerkt_op", { ascending: false })
    .limit(200);
  return (data ?? []).map((r) => ({
    id: r.id as string,
    leerdoelId: r.leerdoel_id as string,
    titel: r.titel as string,
    status: r.status as "concept" | "gepubliceerd",
    duurMs: r.duur_ms as number | null,
    vanMij: r.tutor_id === tutor.id,
    bijgewerktOp: r.bijgewerkt_op as string,
  }));
}
