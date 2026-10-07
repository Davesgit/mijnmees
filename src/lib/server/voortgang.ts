import "server-only";
import type { OpslagData, Poging, Sessie } from "@/features/oefenen/types";
import { createClient } from "@/lib/supabase/server";
import { haalEigenKind } from "./dal";

export type KindVoortgang = Pick<OpslagData, "sessies" | "pogingen" | "weetjes" | "reviews">;

/** Voortgang van een eigen kind, gelezen met de sessie van de ouder (RLS controleert het eigendom). */
export async function haalVoortgang(kindId: string): Promise<KindVoortgang | null> {
  const kind = await haalEigenKind(kindId);
  if (!kind) return null;
  const supabase = await createClient();
  const [sessies, pogingen, weetjes, reviews] = await Promise.all([
    supabase.from("sessies").select("*").eq("kind_id", kind.id).order("gestart_op", { ascending: false }).limit(100),
    supabase.from("pogingen").select("*").eq("kind_id", kind.id).order("op").limit(5000),
    supabase.from("weetjes_ontdekt").select("*").eq("kind_id", kind.id),
    supabase.from("reviews").select("*").eq("kind_id", kind.id),
  ]);
  if (sessies.error || pogingen.error || weetjes.error || reviews.error) throw new Error("Voortgang ophalen lukt niet.");

  return {
    sessies: Object.fromEntries(
      sessies.data.map((s): [string, Sessie] => [
        s.id,
        {
          id: s.id,
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
        op: p.op,
      }),
    ),
    weetjes: weetjes.data.map((w) => ({ weetjeId: w.weetje_id, sessieId: w.sessie_id, dag: w.dag, op: w.op })),
    reviews: reviews.data.map((r) => ({ leerdoelId: r.leerdoel_id, vanSessieId: r.van_sessie_id, op: r.op })),
  };
}

const datumFormaat = new Intl.DateTimeFormat("nl-NL", { timeZone: "Europe/Amsterdam", day: "numeric", month: "long", year: "numeric" });
const tijdFormaat = new Intl.DateTimeFormat("nl-NL", { timeZone: "Europe/Amsterdam", hour: "2-digit", minute: "2-digit" });

export function formatDatum(iso: string) {
  return datumFormaat.format(new Date(iso));
}
export function formatTijd(iso: string) {
  return tijdFormaat.format(new Date(iso));
}

/** "Vandaag", "Gisteren", "3 dagen geleden" of een datum (kalenderdagen in Europe/Amsterdam). */
export function relatieveDag(iso: string, nu = new Date()) {
  const dag = (d: Date) => new Date(new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Amsterdam" }).format(d)).getTime();
  const verschil = Math.round((dag(nu) - dag(new Date(iso))) / 86_400_000);
  if (verschil <= 0) return "Vandaag";
  if (verschil === 1) return "Gisteren";
  if (verschil < 14) return `${verschil} dagen geleden`;
  return formatDatum(iso);
}
