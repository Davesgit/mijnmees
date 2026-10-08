import { NextResponse, type NextRequest } from "next/server";
import { haalTutorLes, lesVoorKind, vragenVoorTutor } from "@/features/live/server";
import { haalActiefKind } from "@/lib/server/dal";
import { haalTutor } from "@/lib/server/rollen";
import { createAdminClient } from "@/lib/supabase/admin";

const geenCache = { "Cache-Control": "no-store" };

/** Vragen ophalen: de tutor ziet alle vragen van de eigen les (zonder namen), een kind alleen de eigen vragen. */
export async function GET(request: NextRequest) {
  const lesId = request.nextUrl.searchParams.get("lesId") ?? "";
  if (request.nextUrl.searchParams.get("rol") === "tutor") {
    const tutor = await haalTutor();
    if (!tutor || tutor.status !== "goedgekeurd") return NextResponse.json({ status: "unauthorized" }, { status: 401, headers: geenCache });
    const [les, vragen] = await Promise.all([haalTutorLes(tutor, lesId), vragenVoorTutor(tutor, lesId)]);
    if (!les || !vragen) return NextResponse.json({ status: "niet-gevonden" }, { status: 404, headers: geenCache });
    return NextResponse.json({ vragen, gepauzeerd: les.vragenGepauzeerd, lesStatus: les.status }, { headers: geenCache });
  }
  const kind = await haalActiefKind();
  if (!kind) return NextResponse.json({ status: "unauthorized" }, { status: 401, headers: geenCache });
  const les = await lesVoorKind(kind.id, lesId);
  if (!les) return NextResponse.json({ status: "niet-gevonden" }, { status: 404, headers: geenCache });
  const { data } = await createAdminClient().from("les_vragen").select("id, tekst, status, aangemaakt_op").eq("les_id", les.id).eq("kind_id", kind.id).order("aangemaakt_op");
  return NextResponse.json(
    { vragen: (data ?? []).map((v) => ({ id: v.id, tekst: v.tekst, beantwoord: v.status === "beantwoord" })), gepauzeerd: les.vragenGepauzeerd, lesStatus: les.status },
    { headers: geenCache },
  );
}
