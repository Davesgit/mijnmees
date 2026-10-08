import { NextResponse } from "next/server";
import { isOuderOntgrendeld } from "@/lib/server/cookies";
import { audit, haalOuder } from "@/lib/server/dal";
import { createClient } from "@/lib/supabase/server";

/** Download van alle gegevens van het eigen gezin (alleen na recente wachtwoordcontrole). */
export async function GET() {
  const ouder = await haalOuder();
  if (!ouder || !(await isOuderOntgrendeld(ouder.id))) {
    return NextResponse.json({ status: "unauthorized" }, { status: 401 });
  }
  const supabase = await createClient();
  const [ouderRij, kinderen, toestemmingen, sessies, pogingen, weetjes, werkbladen, papier, meldingen, hulpvragen] = await Promise.all([
    supabase.from("ouders").select("verklaring_versie, verklaring_op, email_uitleg, email_lessen, aangemaakt_op").eq("id", ouder.id).single(),
    supabase.from("kinderen").select("id, voornaam, groep, avatar, tutorhulp_toegestaan, aangemaakt_op").eq("ouder_id", ouder.id),
    supabase.from("toestemmingen").select("kind_id, soort, waarde, beleid_versie, op").eq("ouder_id", ouder.id),
    supabase.from("sessies").select("*"),
    supabase.from("pogingen").select("*"),
    supabase.from("weetjes_ontdekt").select("*"),
    supabase.from("werkbladen").select("id, code, kind_id, titel, instellingen, vragen, aangemaakt_op").eq("ouder_id", ouder.id),
    supabase.from("papier_resultaten").select("werkblad_id, kind_id, versie, regels, op").eq("ouder_id", ouder.id),
    supabase.from("oudermeldingen").select("kind_id, leerdoel_id, bewijs, aangemaakt_op, afgehandeld_op").eq("ouder_id", ouder.id),
    supabase.from("hulpvragen").select("kind_id, leerdoel_id, bewijs, status, aangemaakt_op, afgerond_op, afsluitreden").eq("ouder_id", ouder.id),
  ]);
  if ([ouderRij, kinderen, toestemmingen, sessies, pogingen, weetjes, werkbladen, papier, meldingen, hulpvragen].some((r) => r.error)) {
    return NextResponse.json({ status: "retryable" }, { status: 503 });
  }

  await audit(ouder.id, "gegevens-gedownload");
  const inhoud = {
    gemaakt_op: new Date().toISOString(),
    uitleg: "Alle gegevens die Mees over je gezin bewaart. Sessies, pogingen en weetjes horen bij de kinderen hieronder.",
    ouder: { email: ouder.email, ...ouderRij.data },
    kinderen: kinderen.data,
    toestemmingen: toestemmingen.data,
    sessies: sessies.data,
    pogingen: pogingen.data,
    weetjes: weetjes.data,
    werkbladen: werkbladen.data,
    papier_resultaten: papier.data,
    oudermeldingen: meldingen.data,
    hulpvragen: hulpvragen.data,
  };
  return new NextResponse(JSON.stringify(inhoud, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="mees-gegevens-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
