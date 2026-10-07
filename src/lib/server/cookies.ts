import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/** Gekozen kinderprofiel op dit apparaat. Alleen een id; eigendom wordt bij elk gebruik opnieuw gecontroleerd. */
export const KIND_COOKIE = "mees_kind";
/** Bewijs dat de ouder recent het wachtwoord heeft ingevoerd (ouderomgeving). */
export const OUDER_COOKIE = "mees_ouder";
/** Hoe lang de ouderomgeving open blijft na wachtwoordcontrole. */
export const OUDER_ONTGRENDELD_MINUTEN = 20;

const basis = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/" };

function onderteken(waarde: string) {
  const geheim = process.env.MEES_COOKIE_SECRET;
  if (!geheim) throw new Error("MEES_COOKIE_SECRET ontbreekt.");
  return createHmac("sha256", geheim).update(waarde).digest("base64url");
}

export async function zetKindCookie(kindId: string) {
  (await cookies()).set(KIND_COOKIE, kindId, { ...basis, maxAge: 60 * 60 * 24 * 180 });
}

export async function wisKindCookie() {
  (await cookies()).delete(KIND_COOKIE);
}

export async function leesKindCookie() {
  return (await cookies()).get(KIND_COOKIE)?.value ?? null;
}

/** Zet een ondertekende, kortlopende ontgrendeling voor de ouderomgeving van deze ouder. */
export async function ontgrendelOuder(ouderId: string) {
  const tot = Date.now() + OUDER_ONTGRENDELD_MINUTEN * 60_000;
  const inhoud = `${ouderId}.${tot}`;
  (await cookies()).set(OUDER_COOKIE, `${inhoud}.${onderteken(inhoud)}`, { ...basis, maxAge: OUDER_ONTGRENDELD_MINUTEN * 60 });
}

export async function vergrendelOuder() {
  (await cookies()).delete(OUDER_COOKIE);
}

export async function isOuderOntgrendeld(ouderId: string) {
  const waarde = (await cookies()).get(OUDER_COOKIE)?.value;
  if (!waarde) return false;
  const [id, tot, handtekening] = waarde.split(".");
  if (!id || !tot || !handtekening || id !== ouderId || Number(tot) < Date.now()) return false;
  const verwacht = Buffer.from(onderteken(`${id}.${tot}`));
  const gegeven = Buffer.from(handtekening);
  return verwacht.length === gegeven.length && timingSafeEqual(verwacht, gegeven);
}
