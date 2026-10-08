"use server";

import { revalidatePath } from "next/cache";
import { lesVoorKind, meldAan } from "@/features/live/server";
import { kanMeedoen, lesConfig, modereerVraag } from "@/features/live/regels";
import { audit, haalActiefKind, haalOuder } from "@/lib/server/dal";
import { createAdminClient } from "@/lib/supabase/admin";

export type LesActieStatus = { gelukt?: boolean; melding?: string };

/** L02: "Ik wil meedoen". Alleen met toestemming van de ouder; plekken worden atomair geteld. */
export async function ikDoeMee(_: LesActieStatus, form: FormData): Promise<LesActieStatus> {
  const [ouder, kind] = await Promise.all([haalOuder(), haalActiefKind()]);
  if (!ouder || !kind) return { melding: "Vraag je ouder om in te loggen." };
  const lesId = String(form.get("lesId") ?? "");
  const les = await lesVoorKind(kind.id, lesId);
  if (!les) return { melding: "Deze les is niet gevonden." };
  const r = await meldAan(kind.id, les.id);
  const meldingen: Record<string, string> = {
    vol: "De les is vol. Je kunt de les later misschien terugkijken.",
    gesloten: "Deze les is al voorbij of gaat niet door.",
    "geen-toestemming": "Je ouder moet eerst toestemming geven.",
    fout: "Dit lukt nu niet. Probeer het nog eens.",
  };
  if (r !== "ok" && r !== "al") return { melding: meldingen[r] };
  await audit(ouder.id, "les-aangemeld", les.id);
  revalidatePath(`/kind/lessen/${les.id}`);
  return { gelukt: true };
}

export async function nietNu(form: FormData) {
  const kind = await haalActiefKind();
  const lesId = String(form.get("lesId") ?? "");
  if (kind && (await lesVoorKind(kind.id, lesId))) {
    await createAdminClient().from("les_uitnodigingen").update({ kind_aanmelding: "nee" }).eq("les_id", lesId).eq("kind_id", kind.id).is("kind_aanmelding", null);
  }
  revalidatePath("/kind/start");
}

/** L04: privévraag aan de tutor. Alleen dit kind en de tutor zien hem. */
export async function stelVraag(lesId: string, tekst: string): Promise<{ ok: boolean; melding?: string }> {
  const kind = await haalActiefKind();
  if (!kind) return { ok: false, melding: "Je bent niet meer ingelogd." };
  const les = await lesVoorKind(kind.id, lesId);
  if (!les || les.uitnodiging.kindAanmelding !== "ja" || !kanMeedoen(les.status, les.startOp, les.duurMin)) return { ok: false, melding: "De les loopt nu niet." };
  if (les.vragenGepauzeerd) return { ok: false, melding: "De tutor beantwoordt even geen vragen. Je kunt wel blijven kijken." };
  const schoon = tekst.replace(/\s+/g, " ").trim().slice(0, 200);
  if (schoon.length < 2) return { ok: false, melding: "Typ eerst je vraag." };

  const db = createAdminClient();
  const { data: eerder } = await db.from("les_vragen").select("aangemaakt_op").eq("les_id", lesId).eq("kind_id", kind.id).order("aangemaakt_op", { ascending: false });
  if ((eerder ?? []).length >= lesConfig.maxVragenPerKind) return { ok: false, melding: "Je hebt al genoeg vragen gesteld. De tutor kijkt ernaar." };
  if (eerder?.[0] && Date.now() - Date.parse(eerder[0].aangemaakt_op) < lesConfig.vraagPauzeSec * 1000) return { ok: false, melding: "Wacht even voordat je nog een vraag stelt." };

  const moderatie = modereerVraag(schoon);
  const { error } = await db.from("les_vragen").insert({ les_id: lesId, kind_id: kind.id, tekst: schoon, status: moderatie.status, reden: moderatie.reden ?? null });
  if (error) return { ok: false, melding: "Dit lukt nu niet. Probeer het nog eens." };
  return { ok: true, melding: moderatie.status === "apart" ? "Je vraag is verstuurd. Deel geen namen, adressen of contactgegevens." : "Je vraag is verstuurd. Alleen de tutor ziet hem." };
}
