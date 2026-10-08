import type { BordElement } from "@/features/tutorhulp/bord";
import type { ZonderTijd } from "@/features/tutorhulp/Tekenbord";

// Berichten van de tutor naar de kinderen via het LiveKit-datakanaal. Alleen de tutor mag sturen
// (kinderen krijgen geen recht om data te publiceren). Kleine berichten: grote borden gaan in stukjes.

export type LesBericht = { v: 1; soort: "bord"; g: ZonderTijd } | { v: 1; soort: "einde" };

const MAX_BYTES = 12_000;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

export const codeer = (b: LesBericht): Uint8Array<ArrayBuffer> => encoder.encode(JSON.stringify(b)) as Uint8Array<ArrayBuffer>;

export function decodeer(data: Uint8Array): LesBericht | null {
  try {
    const b = JSON.parse(decoder.decode(data)) as LesBericht;
    return b?.v === 1 && (b.soort === "bord" || b.soort === "einde") ? b : null;
  } catch {
    return null;
  }
}

/** Het hele bord als reeks berichten: eerst 'zet' met wat past, daarna 'plaats' per resterend onderdeel. */
export function bordInStukjes(elementen: BordElement[]): Uint8Array<ArrayBuffer>[] {
  const berichten: Uint8Array<ArrayBuffer>[] = [];
  let eerste: BordElement[] = [];
  let i = 0;
  for (; i < elementen.length; i++) {
    const proef = codeer({ v: 1, soort: "bord", g: { op: "zet", elementen: [...eerste, elementen[i]] } });
    if (proef.byteLength > MAX_BYTES) break;
    eerste = [...eerste, elementen[i]];
  }
  berichten.push(codeer({ v: 1, soort: "bord", g: { op: "zet", elementen: eerste } }));
  for (; i < elementen.length; i++) {
    const b = codeer({ v: 1, soort: "bord", g: { op: "plaats", element: elementen[i] } });
    if (b.byteLength <= MAX_BYTES) berichten.push(b);
  }
  return berichten;
}

/** Eén wijziging; een te groot 'zet'-bericht (bijv. ongedaan maken met veel tekeningen) gaat in stukjes. */
export function wijzigingInStukjes(g: ZonderTijd): Uint8Array<ArrayBuffer>[] {
  const b = codeer({ v: 1, soort: "bord", g });
  if (b.byteLength <= MAX_BYTES) return [b];
  return g.op === "zet" ? bordInStukjes(g.elementen) : [];
}
