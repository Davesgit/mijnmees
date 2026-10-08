import { NextResponse } from "next/server";
import { haalEigenWerkblad } from "@/features/werkbladen/server";

/** Werkblad van de ingelogde ouder ophalen (zonder antwoorden; die rekent het apparaat uit de vraagversies). */
export async function GET(_: Request, { params }: RouteContext<"/api/werkbladen/[werkbladId]">) {
  const { werkbladId } = await params;
  const werkblad = await haalEigenWerkblad(werkbladId);
  if (!werkblad) return NextResponse.json({ status: "niet-gevonden" }, { status: 404, headers: { "Cache-Control": "no-store" } });
  return NextResponse.json({ status: "accepted", werkblad }, { headers: { "Cache-Control": "no-store" } });
}
