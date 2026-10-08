import { NextResponse, type NextRequest } from "next/server";
import { haalTutorLes, lesVoorKind, liveGeconfigureerd, maakToken } from "@/features/live/server";
import { kanMeedoen } from "@/features/live/regels";
import { haalActiefKind } from "@/lib/server/dal";
import { haalTutor } from "@/lib/server/rollen";
import { createAdminClient } from "@/lib/supabase/admin";

const geen = (status: number, reden: string) => NextResponse.json({ status: "geweigerd", reden }, { status, headers: { "Cache-Control": "no-store" } });

/** Kortlevend LiveKit-token. Tutor: eigen lopende les. Kind: uitgenodigd, ouder heeft toegestaan, aangemeld, les loopt. */
export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return geen(403, "herkomst");
  if (!liveGeconfigureerd()) return geen(503, "Live-geluid is niet aangesloten.");
  const body = (await request.json().catch(() => null)) as { lesId?: string; rol?: string } | null;
  const lesId = String(body?.lesId ?? "");

  if (body?.rol === "tutor") {
    const tutor = await haalTutor();
    if (!tutor || tutor.status !== "goedgekeurd") return geen(401, "geen tutor");
    const les = await haalTutorLes(tutor, lesId);
    if (!les || les.status !== "live") return geen(403, "les loopt niet");
    return NextResponse.json({ token: await maakToken(les, "tutor"), url: process.env.NEXT_PUBLIC_LIVEKIT_URL }, { headers: { "Cache-Control": "no-store" } });
  }

  const kind = await haalActiefKind();
  if (!kind) return geen(401, "geen kind");
  const les = await lesVoorKind(kind.id, lesId);
  if (!les || les.uitnodiging.status !== "toegestaan" || les.uitnodiging.kindAanmelding !== "ja") return geen(403, "geen toegang");
  if (!kanMeedoen(les.status, les.startOp, les.duurMin)) return geen(403, "les loopt niet");
  await createAdminClient().from("les_uitnodigingen").update({ aanwezig_op: new Date().toISOString() }).eq("les_id", les.id).eq("kind_id", kind.id).is("aanwezig_op", null);
  return NextResponse.json({ token: await maakToken(les, "kind"), url: process.env.NEXT_PUBLIC_LIVEKIT_URL }, { headers: { "Cache-Control": "no-store" } });
}
