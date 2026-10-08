import "server-only";
import { randomBytes } from "node:crypto";
import { AccessToken, RoomServiceClient, TrackSource } from "livekit-server-sdk";
import { tutorhulpMogelijk } from "@/features/tutorhulp/criteria";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Tutor } from "@/lib/server/rollen";
import { lesConfig, lesSignalen, type LesStatus } from "./regels";

// Datalaag voor live-lessen. Alles via de serversleutel, maar steeds na een expliciete eigendomscontrole
// en met alleen de velden die het scherm nodig heeft. Kindnamen gaan nooit naar LiveKit.

export type Les = {
  id: string;
  tutorId: string;
  leerdoelId: string;
  titel: string;
  startOp: string;
  duurMin: number;
  capaciteit: number;
  opnemen: boolean;
  status: LesStatus;
  roomNaam: string;
  vragenGepauzeerd: boolean;
  opnameUitlegId: string | null;
};

const LES_VELDEN = "id, tutor_id, leerdoel_id, titel, start_op, duur_min, capaciteit, opnemen, status, room_naam, vragen_gepauzeerd, opname_uitleg_id";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const naarLes = (r: any): Les => ({
  id: r.id,
  tutorId: r.tutor_id,
  leerdoelId: r.leerdoel_id,
  titel: r.titel,
  startOp: r.start_op,
  duurMin: r.duur_min,
  capaciteit: r.capaciteit,
  opnemen: r.opnemen,
  status: r.status,
  roomNaam: r.room_naam,
  vragenGepauzeerd: r.vragen_gepauzeerd,
  opnameUitlegId: r.opname_uitleg_id,
});

const isId = (id: string) => /^[0-9a-f-]{36}$/i.test(id);

/* ---------- Lesvoorstellen ---------- */

async function signaalGegevens() {
  const vanaf = new Date(Date.now() - lesConfig.signaalDagen * 86_400_000).toISOString();
  const { data } = await createAdminClient().from("pogingen").select("kind_id, leerdoel_id, op").eq("hulp_uitleg", true).gte("op", vanaf).limit(10000);
  return lesSignalen((data ?? []).filter((p) => tutorhulpMogelijk(p.leerdoel_id)).map((p) => ({ kindId: p.kind_id, leerdoelId: p.leerdoel_id, op: p.op })));
}

/** Lesvoorstellen voor deze tutor: alleen aantallen, zonder voorstellen die opzij zijn gezet of al een les hebben. */
export async function haalLesvoorstellen(tutor: Tutor) {
  const db = createAdminClient();
  const [signalen, { data: besluiten }, { data: lessen }] = await Promise.all([
    signaalGegevens(),
    db.from("lesvoorstel_besluiten").select("leerdoel_id").eq("tutor_id", tutor.id).gt("tot", new Date().toISOString()),
    db.from("live_lessen").select("leerdoel_id").in("status", ["gepland", "live"]),
  ]);
  const opzij = new Set((besluiten ?? []).map((b) => b.leerdoel_id));
  const metLes = new Set((lessen ?? []).map((l) => l.leerdoel_id));
  return signalen.filter((s) => !opzij.has(s.leerdoelId) && !metLes.has(s.leerdoelId)).map((s) => ({ leerdoelId: s.leerdoelId, aantal: s.kinderen.length }));
}

export async function haalLesvoorstel(leerdoelId: string) {
  const s = (await signaalGegevens()).find((x) => x.leerdoelId === leerdoelId);
  return s ? { leerdoelId, aantal: s.kinderen.length } : null;
}

/** Les plannen + uitnodigingen voor de kinderen uit het signaal (hun ouders beslissen). */
export async function planLes(tutor: Tutor, invoer: { leerdoelId: string; titel: string; startOp: string; duurMin: number; capaciteit: number; opnemen: boolean }) {
  const db = createAdminClient();
  const kinderen = (await signaalGegevens()).find((s) => s.leerdoelId === invoer.leerdoelId)?.kinderen ?? [];
  if (kinderen.length === 0) return { fout: "Er zijn op dit moment geen kinderen voor dit onderdeel om uit te nodigen." } as const;
  const { data: les, error } = await db
    .from("live_lessen")
    .insert({
      tutor_id: tutor.id,
      leerdoel_id: invoer.leerdoelId,
      titel: invoer.titel,
      start_op: invoer.startOp,
      duur_min: invoer.duurMin,
      capaciteit: invoer.capaciteit,
      opnemen: invoer.opnemen,
      room_naam: `les-${randomBytes(9).toString("hex")}`,
    })
    .select("id")
    .single();
  if (error || !les) return { fout: "Dit lukt nu niet. Probeer het nog eens." } as const;
  const { data: rijen } = await db.from("kinderen").select("id, ouder_id").in("id", kinderen);
  if (rijen?.length) {
    await db.from("les_uitnodigingen").insert(rijen.map((k) => ({ les_id: les.id, kind_id: k.id, ouder_id: k.ouder_id })));
  }
  return { id: les.id as string, uitgenodigd: rijen?.length ?? 0 } as const;
}

export async function zetVoorstelOpzij(tutor: Tutor, leerdoelId: string, reden: string) {
  await createAdminClient()
    .from("lesvoorstel_besluiten")
    .insert({ tutor_id: tutor.id, leerdoel_id: leerdoelId, reden, tot: new Date(Date.now() + 7 * 86_400_000).toISOString() });
}

/* ---------- Tutor ---------- */

export async function haalTutorLessen(tutor: Tutor) {
  const db = createAdminClient();
  const { data } = await db.from("live_lessen").select(LES_VELDEN).eq("tutor_id", tutor.id).order("start_op", { ascending: false }).limit(50);
  const lessen = (data ?? []).map(naarLes);
  const { data: tellingen } = lessen.length
    ? await db.from("les_uitnodigingen").select("les_id, status, kind_aanmelding").in("les_id", lessen.map((l) => l.id))
    : { data: [] };
  return lessen.map((l) => {
    const eigen = (tellingen ?? []).filter((t) => t.les_id === l.id);
    return { ...l, uitgenodigd: eigen.length, toegestaan: eigen.filter((t) => t.status === "toegestaan").length, aangemeld: eigen.filter((t) => t.kind_aanmelding === "ja").length };
  });
}

export async function haalTutorLes(tutor: Tutor, lesId: string): Promise<Les | null> {
  if (!isId(lesId)) return null;
  const { data } = await createAdminClient().from("live_lessen").select(LES_VELDEN).eq("id", lesId).eq("tutor_id", tutor.id).maybeSingle();
  return data ? naarLes(data) : null;
}

export async function zetLesStatus(tutor: Tutor, lesId: string, wijziging: Partial<{ status: LesStatus; gestart_op: string; geeindigd_op: string; vragen_gepauzeerd: boolean; opname_uitleg_id: string }>) {
  const { error } = await createAdminClient().from("live_lessen").update(wijziging).eq("id", lesId).eq("tutor_id", tutor.id);
  return !error;
}

/** Vragen voor de tutor: zonder naam of kind-id. */
export async function vragenVoorTutor(tutor: Tutor, lesId: string) {
  const les = await haalTutorLes(tutor, lesId);
  if (!les) return null;
  const { data } = await createAdminClient().from("les_vragen").select("id, tekst, status, reden, aangemaakt_op").eq("les_id", lesId).order("aangemaakt_op");
  return (data ?? []).map((v) => ({ id: v.id as string, tekst: v.tekst as string, status: v.status as "nieuw" | "apart" | "beantwoord", reden: v.reden as string | null, op: v.aangemaakt_op as string }));
}

export async function zetVraagStatus(tutor: Tutor, lesId: string, vraagId: string, status: "nieuw" | "apart" | "beantwoord") {
  const les = await haalTutorLes(tutor, lesId);
  if (!les || !isId(vraagId)) return false;
  const { error } = await createAdminClient().from("les_vragen").update({ status }).eq("id", vraagId).eq("les_id", lesId);
  return !error;
}

/* ---------- Ouder en kind ---------- */

export type KindLes = Les & { tutorVoornaam: string; uitnodiging: { status: "uitgenodigd" | "toegestaan" | "geweigerd"; kindAanmelding: "ja" | "nee" | null }; aangemeld: number; opnameGepubliceerd: boolean };

/** Een les waarvoor dit kind is uitgenodigd (het eigendom van het kind controleert de aanroeper). */
export async function lesVoorKind(kindId: string, lesId: string): Promise<KindLes | null> {
  if (!isId(lesId)) return null;
  const db = createAdminClient();
  const { data: u } = await db.from("les_uitnodigingen").select("status, kind_aanmelding").eq("les_id", lesId).eq("kind_id", kindId).maybeSingle();
  if (!u) return null;
  const { data: l } = await db.from("live_lessen").select(LES_VELDEN).eq("id", lesId).single();
  if (!l) return null;
  const les = naarLes(l);
  const [{ data: tutor }, { count }, { data: opname }] = await Promise.all([
    db.from("tutors").select("voornaam").eq("id", les.tutorId).maybeSingle(),
    db.from("les_uitnodigingen").select("*", { count: "exact", head: true }).eq("les_id", lesId).eq("kind_aanmelding", "ja"),
    les.opnameUitlegId ? db.from("uitleg").select("status").eq("id", les.opnameUitlegId).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  return {
    ...les,
    tutorVoornaam: (tutor?.voornaam as string | undefined) ?? "de tutor",
    uitnodiging: { status: u.status, kindAanmelding: u.kind_aanmelding },
    aangemeld: count ?? 0,
    opnameGepubliceerd: opname?.status === "gepubliceerd",
  };
}

/** Alle uitnodigingen van een kind die nog relevant zijn (gepland, live, of met opname). */
export async function lessenVoorKind(kindId: string) {
  const db = createAdminClient();
  const { data } = await db.from("les_uitnodigingen").select("les_id").eq("kind_id", kindId).neq("status", "geweigerd").order("aangemaakt_op", { ascending: false }).limit(20);
  const lessen = await Promise.all((data ?? []).map((u) => lesVoorKind(kindId, u.les_id)));
  return lessen.filter((l): l is KindLes => l !== null && l.status !== "geannuleerd");
}

export async function meldAan(kindId: string, lesId: string) {
  const { data, error } = await createAdminClient().rpc("meld_aan_voor_les", { p_les: lesId, p_kind: kindId });
  return error ? "fout" : (data as "ok" | "al" | "vol" | "gesloten" | "geen-toestemming");
}

/* ---------- LiveKit ---------- */

export function liveGeconfigureerd() {
  return Boolean(process.env.NEXT_PUBLIC_LIVEKIT_URL && process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_API_SECRET);
}

/**
 * Kortlevend token. Tutor: alleen microfoon publiceren + bordgegevens sturen.
 * Kind: alleen luisteren/ontvangen, verborgen, met een willekeurige identiteit (geen naam of id).
 */
export async function maakToken(les: Les, rol: "tutor" | "kind") {
  const at = new AccessToken(process.env.LIVEKIT_API_KEY!, process.env.LIVEKIT_API_SECRET!, {
    identity: `${rol}-${randomBytes(8).toString("hex")}`,
    ttl: "2h",
  });
  at.addGrant(
    rol === "tutor"
      ? { room: les.roomNaam, roomJoin: true, canPublish: true, canPublishSources: [TrackSource.MICROPHONE], canPublishData: true, canSubscribe: true }
      : { room: les.roomNaam, roomJoin: true, canPublish: false, canPublishData: false, canSubscribe: true, hidden: true },
  );
  return at.toJwt();
}

export async function sluitRuimte(les: Les) {
  if (!liveGeconfigureerd()) return;
  const url = process.env.NEXT_PUBLIC_LIVEKIT_URL!.replace(/^wss:/, "https:");
  await new RoomServiceClient(url, process.env.LIVEKIT_API_KEY!, process.env.LIVEKIT_API_SECRET!).deleteRoom(les.roomNaam).catch(() => {});
}
