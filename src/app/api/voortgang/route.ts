import { NextResponse, type NextRequest } from "next/server";
import { weetjes as weetjesCatalogus } from "@/content/weetjes";
import { isGoed, vindVraag } from "@/features/oefenen/vragen";
import type { OpslagData, Poging, Sessie } from "@/features/oefenen/types";
import { syncVerzoekSchema, type SyncAntwoord } from "@/lib/opslag/schema";
import { haalActiefKind } from "@/lib/server/dal";
import { createAdminClient } from "@/lib/supabase/admin";

// Synchronisatie van voortgang voor het actieve kinderprofiel op dit apparaat.
// Volgorde per verzoek: actor controleren → invoer valideren → eigendom controleren → idempotent opslaan.

function antwoord(body: SyncAntwoord, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function zelfdeHerkomst(request: NextRequest) {
  const origin = request.headers.get("origin");
  return !origin || origin === request.nextUrl.origin;
}

export async function POST(request: NextRequest) {
  if (!zelfdeHerkomst(request)) return antwoord({ status: "unauthorized" }, 403);
  const kind = await haalActiefKind();
  if (!kind) return antwoord({ status: "unauthorized" }, 401);

  const json = await request.json().catch(() => null);
  const verzoek = syncVerzoekSchema.safeParse(json);
  if (!verzoek.success) return antwoord({ status: "invalid" }, 400);
  const { sessies, pogingen, weetjes, reviews } = verzoek.data;

  const db = createAdminClient();

  // Sessies: alleen van dit kind, en alleen een nieuwere versie overschrijft.
  const sessieIds = [...new Set([...sessies.map((s) => s.id), ...pogingen.map((p) => p.sessieId), ...weetjes.map((w) => w.sessieId)])];
  const { data: bestaand, error: leesFout } = sessieIds.length
    ? await db.from("sessies").select("id, kind_id, versie, status").in("id", sessieIds)
    : { data: [], error: null };
  if (leesFout) return antwoord({ status: "retryable" }, 503);

  const bekend = new Map((bestaand ?? []).map((s) => [s.id as string, s]));
  if ([...bekend.values()].some((s) => s.kind_id !== kind.id)) return antwoord({ status: "unauthorized" }, 403);

  const teSchrijven = sessies.filter((s) => (bekend.get(s.id)?.versie ?? 0) < s.versie);
  if (teSchrijven.length) {
    const { error } = await db.from("sessies").upsert(
      teSchrijven.map((s) => ({
        id: s.id,
        kind_id: kind.id,
        soort: s.soort ?? "oefening",
        instellingen: s.instellingen ?? {},
        leerdoel_id: s.leerdoelId,
        onderdeel_id: s.onderdeelId,
        onderwerp_id: s.onderwerpId,
        niveau: s.niveau,
        aantal: s.aantal,
        bron: s.bron,
        slots: s.slots,
        huidige_index: s.index,
        versie: s.versie,
        status: s.status,
        gestart_op: s.gestartOp,
        afgerond_op: s.afgerondOp ?? null,
        bijgewerkt_op: new Date().toISOString(),
      })),
    );
    if (error) return antwoord({ status: "retryable" }, 503);
    for (const s of teSchrijven) bekend.set(s.id, { id: s.id, kind_id: kind.id, versie: s.versie, status: s.status });
  }

  // Pogingen: de server beoordeelt het antwoord zelf; het resultaat van het apparaat telt niet.
  const geldigePogingen = pogingen.filter((p) => bekend.has(p.sessieId) && vindVraag(p.vraagId));
  if (geldigePogingen.length) {
    const { error } = await db.from("pogingen").upsert(
      geldigePogingen.map((p) => {
        const vraag = vindVraag(p.vraagId)!;
        return {
          event_id: p.eventId,
          kind_id: kind.id,
          sessie_id: p.sessieId,
          slot_id: p.slotId,
          vraag_id: p.vraagId,
          vraag_versie: p.vraagVersie,
          leerdoel_id: vraag.learningGoalId,
          antwoord: p.antwoord,
          resultaat: isGoed(vraag, p.antwoord) ? "goed" : "fout",
          eerste_poging: p.eerstePoging,
          hulp_hints: p.hulpVooraf.hints,
          hulp_uitleg: p.hulpVooraf.uitleg,
          actieve_duur_ms: p.actieveDuurMs ?? null,
          op: p.op,
        };
      }),
      { onConflict: "event_id", ignoreDuplicates: true },
    );
    if (error) return antwoord({ status: "retryable" }, 503);
  }

  // Weetjes: bestaand weetje, afgeronde eigen sessie; dubbele dag of dubbel weetje wordt genegeerd.
  const geaccepteerdeWeetjes: string[] = [];
  for (const w of weetjes) {
    const sessie = bekend.get(w.sessieId);
    if (!sessie || sessie.status !== "afgerond" || !weetjesCatalogus.some((c) => c.id === w.weetjeId)) continue;
    const { error } = await db
      .from("weetjes_ontdekt")
      .insert({ kind_id: kind.id, weetje_id: w.weetjeId, sessie_id: w.sessieId, dag: w.dag, op: w.op });
    if (!error || error.code === "23505") geaccepteerdeWeetjes.push(w.weetjeId);
  }

  // Reviews: de lijst van het apparaat is de actuele stand.
  await db.from("reviews").delete().eq("kind_id", kind.id);
  if (reviews.length) {
    await db.from("reviews").insert(
      reviews.map((r) => ({ kind_id: kind.id, leerdoel_id: r.leerdoelId, van_sessie_id: r.vanSessieId, op: r.op })),
    );
  }

  return antwoord({
    status: "accepted",
    sessies: Object.fromEntries(sessies.filter((s) => bekend.has(s.id)).map((s) => [s.id, s.versie])),
    pogingen: geldigePogingen.map((p) => p.eventId),
    weetjes: geaccepteerdeWeetjes,
  });
}

/** Haalt de opgeslagen voortgang van het actieve kind op, om een nieuw apparaat bij te werken. */
export async function GET() {
  const kind = await haalActiefKind();
  if (!kind) return NextResponse.json({ status: "unauthorized" }, { status: 401 });
  const db = createAdminClient();

  const [sessies, pogingen, weetjes, reviews] = await Promise.all([
    db.from("sessies").select("*").eq("kind_id", kind.id).order("gestart_op", { ascending: false }).limit(200),
    db.from("pogingen").select("*").eq("kind_id", kind.id).order("op", { ascending: false }).limit(5000),
    db.from("weetjes_ontdekt").select("*").eq("kind_id", kind.id),
    db.from("reviews").select("*").eq("kind_id", kind.id),
  ]);
  if (sessies.error || pogingen.error || weetjes.error || reviews.error) {
    return NextResponse.json({ status: "retryable" }, { status: 503 });
  }

  const data: Pick<OpslagData, "sessies" | "pogingen" | "weetjes" | "reviews"> = {
    sessies: Object.fromEntries(
      sessies.data.map((s): [string, Sessie] => [
        s.id,
        {
          id: s.id,
          soort: s.soort,
          instellingen: s.instellingen,
          leerdoelId: s.leerdoel_id,
          onderdeelId: s.onderdeel_id,
          onderwerpId: s.onderwerp_id,
          niveau: s.niveau,
          aantal: s.aantal,
          bron: s.bron,
          slots: s.slots,
          index: s.huidige_index,
          versie: s.versie,
          status: s.status,
          gestartOp: s.gestart_op,
          afgerondOp: s.afgerond_op ?? undefined,
        },
      ]),
    ),
    pogingen: pogingen.data.map(
      (p): Poging => ({
        eventId: p.event_id,
        sessieId: p.sessie_id,
        slotId: p.slot_id,
        vraagId: p.vraag_id,
        vraagVersie: p.vraag_versie,
        leerdoelId: p.leerdoel_id,
        antwoord: p.antwoord,
        resultaat: p.resultaat,
        eerstePoging: p.eerste_poging,
        hulpVooraf: { hints: p.hulp_hints, uitleg: p.hulp_uitleg },
        actieveDuurMs: p.actieve_duur_ms ?? undefined,
        op: p.op,
      }),
    ),
    weetjes: weetjes.data.map((w) => ({ weetjeId: w.weetje_id, sessieId: w.sessie_id, dag: w.dag, op: w.op })),
    reviews: reviews.data.map((r) => ({ leerdoelId: r.leerdoel_id, vanSessieId: r.van_sessie_id, op: r.op })),
  };

  return NextResponse.json({ status: "accepted", data }, { headers: { "Cache-Control": "no-store" } });
}
