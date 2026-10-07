// Logicatests voor de oefensessies (zonder browser). Draaien: npx tsx scripts/test-logica.ts
import assert from "node:assert/strict";
import { landenVanGebieden, telEuropaOnderdelen } from "@/features/oefenen/europa-sessie";
import {
  gaVerder,
  maakEuropaSessie,
  maakNiveauSessie,
  maakSessie,
  maakTafelSessie,
  niveauAdvies,
  registreerAntwoord,
  sessieStatistiek,
  vraagHulp,
  werkPuzzelBij,
} from "@/features/oefenen/sessie";
import type { OpslagData, Sessie } from "@/features/oefenen/types";
import { isGoed, vindVraag } from "@/features/oefenen/vragen";

let geslaagd = 0;
function test(naam: string, fn: () => void) {
  fn();
  geslaagd++;
  console.log("  ✓", naam);
}

const leeg = (): OpslagData => ({
  schemaVersie: 1,
  gastId: "test",
  sessies: {},
  pogingen: [],
  weetjes: [],
  reviews: [],
  instellingen: { groteTekst: false, rustigeOvergangen: false, rustigVerder: false },
});

function goedAntwoord(sessie: Sessie, slotIndex = sessie.index) {
  const v = vindVraag(sessie.slots[slotIndex].vraagId)!;
  if (v.soort === "breuk") return v.answer;
  if (v.soort === "tafel") return String(v.answer);
  return v.doel;
}

function speelUit(data: OpslagData, id: string, metHulpBij: number[] = []) {
  for (let stap = 0; stap < 500; stap++) {
    const s = data.sessies[id];
    if (s.status === "afgerond") return data;
    if (metHulpBij.includes(stap)) data = vraagHulp(data, id);
    data = registreerAntwoord(data, id, goedAntwoord(s))!.data;
    data = gaVerder(data, id);
  }
  throw new Error("Sessie rondt niet af");
}

console.log("Tafels");
test("tafelvragen worden goed beoordeeld", () => {
  assert.ok(isGoed(vindVraag("tafel-7-x-8")!, "56"));
  assert.ok(!isGoed(vindVraag("tafel-7-x-8")!, "54"));
  assert.ok(isGoed(vindVraag("tafel-7-d-56")!, "8"));
  assert.equal(vindVraag("tafel-7-d-55"), null);
  assert.equal(vindVraag("tafel-13-x-2"), null);
});
test("tafelsessie gebruikt alleen gekozen tafels, zonder dubbele vragen", () => {
  const { data, sessie } = maakTafelSessie(leeg(), { tafels: [6, 7], bewerkingen: ["x", ":"], aantal: 12, metTijd: false, bron: "zelf" });
  assert.equal(sessie.slots.length, 12);
  assert.equal(new Set(sessie.slots.map((s) => s.vraagId)).size, 12);
  for (const s of sessie.slots) assert.match(s.vraagId, /^tafel-(6|7)-/);
  const klaar = speelUit(data, sessie.id);
  assert.equal(klaar.sessies[sessie.id].status, "afgerond");
  assert.equal(sessieStatistiek(klaar.sessies[sessie.id]).zelfstandig, 12);
  assert.ok(klaar.pogingen.every((p) => /^(tafel|deeltafel)-(6|7)$/.test(p.leerdoelId)));
});
test("hulp bij een tafel plant een vervolgvraag van dezelfde tafel", () => {
  const { data, sessie } = maakTafelSessie(leeg(), { tafels: [8], bewerkingen: ["x"], aantal: 6, metTijd: false, bron: "zelf" });
  let d = vraagHulp(data, sessie.id);
  d = registreerAntwoord(d, sessie.id, goedAntwoord(d.sessies[sessie.id]))!.data;
  const s = d.sessies[sessie.id];
  const vervolg = s.slots.find((x) => x.herhalingVan);
  assert.ok(vervolg, "vervolgvraag gepland");
  assert.match(vervolg!.vraagId, /^tafel-8-x-/);
  assert.equal(s.slots.length, 6, "geen extra vraagplaatsen");
});

console.log("Europa");
test("West-Europa: landen + hoofdsteden = 14 onderdelen", () => {
  const landen = landenVanGebieden(["west"]);
  assert.equal(landen.length, 7);
  assert.equal(telEuropaOnderdelen(landen, ["landen", "hoofdsteden"]), 14);
  const { sessie } = maakEuropaSessie(leeg(), { gebieden: ["west"], landen, onderwerpen: ["landen", "hoofdsteden"], vorm: "afwisselend" });
  assert.equal(sessie.slots.length, 14);
  const doelen = sessie.slots.map((s) => vindVraag(s.vraagId)).map((v) => (v?.soort === "europa" ? `${v.module}:${v.doel}` : "?"));
  assert.equal(new Set(doelen).size, 14, "elk object één keer");
  for (const s of sessie.slots) {
    const v = vindVraag(s.vraagId);
    assert.equal(v?.soort, "europa");
    if (v?.soort === "europa" && v.type === "choice" && !v.opties) {
      assert.ok(s.opties && s.opties.length >= 2, `opties voor ${s.vraagId}`);
      assert.ok(s.opties!.some((o) => o.id === v.doel), `goed antwoord tussen opties ${s.vraagId}`);
    }
  }
});
test("Europa: hulp voegt één herhaling in, totaal telt unieke onderdelen", () => {
  const landen = landenVanGebieden(["west"]);
  const { data, sessie } = maakEuropaSessie(leeg(), { gebieden: ["west"], landen, onderwerpen: ["landen"], vorm: "afwisselend" });
  const klaar = speelUit(data, sessie.id, [0, 1]);
  const s = klaar.sessies[sessie.id];
  assert.equal(s.status, "afgerond");
  assert.ok(s.slots.length > 7 && s.slots.length <= 9, `herhalingen ingevoegd (${s.slots.length})`);
  assert.equal(sessieStatistiek(s).aantal, 7, "herhalingen tellen niet mee in het totaal");
  assert.equal(klaar.weetjes.length, 1, "weetje bij afronden");
});
test("Heel Europa met alle onderwerpen werkt", () => {
  const landen = landenVanGebieden(["heel"]);
  const { data, sessie } = maakEuropaSessie(leeg(), { gebieden: ["heel"], landen, onderwerpen: ["landen", "hoofdsteden", "wateren", "gebergten", "ligging"], vorm: "afwisselend" });
  assert.ok(sessie.slots.length > 100);
  const klaar = speelUit(data, sessie.id);
  assert.equal(klaar.sessies[sessie.id].status, "afgerond");
});
test("puzzel: elk land één stukje, fout keert terug, klaar als alles ligt", () => {
  const landen = landenVanGebieden(["west"]);
  let { data, sessie } = maakEuropaSessie(leeg(), { gebieden: ["west"], landen, onderwerpen: [], vorm: "puzzel" });
  assert.equal(sessie.slots.length, 7);
  const eerste = sessie.slots[0];
  const fout = landen.find((l) => `puzzel-${l}` !== eerste.vraagId)!;
  const r = registreerAntwoord(data, sessie.id, fout, { slotId: eerste.id })!;
  assert.equal(r.beoordeling, "fout");
  data = r.data;
  assert.equal(data.sessies[sessie.id].slots[0].uitkomst, undefined, "stukje ligt nog niet");
  for (const slot of [...sessie.slots].reverse()) {
    data = registreerAntwoord(data, sessie.id, slot.vraagId.slice(7), { slotId: slot.id })!.data;
    data = werkPuzzelBij(data, sessie.id);
  }
  sessie = data.sessies[sessie.id];
  assert.equal(sessie.status, "afgerond");
  assert.equal(sessie.slots.find((s) => s.id === eerste.id)?.uitkomst, "met-hulp", "eerder fout = met hulp");
});

console.log("Niveaubepaling");
test("alles zelfstandig goed → uitdagend advies", () => {
  const { data, sessie } = maakNiveauSessie(leeg(), "breuken");
  const klaar = speelUit(data, sessie.id);
  const s = klaar.sessies[sessie.id];
  assert.equal(s.status, "afgerond");
  assert.equal(s.slots.length, 8);
  const advies = niveauAdvies(s);
  assert.equal(advies.niveau, "uitdagend");
  assert.ok(advies.zeker);
  assert.equal(klaar.weetjes.length, 0, "geen weetje voor de niveaubepaling");
});
test("steeds met hulp → makkelijk, onzeker", () => {
  const { data, sessie } = maakNiveauSessie(leeg(), "tafels");
  const klaar = speelUit(data, sessie.id, [0, 1, 2, 3, 4, 5, 6, 7]);
  const advies = niveauAdvies(klaar.sessies[sessie.id]);
  assert.equal(advies.niveau, "makkelijk");
  assert.equal(advies.zeker, false);
});

console.log("Rekenen (bestaand)");
test("breukensessie werkt nog", () => {
  const { data, sessie } = maakSessie(leeg(), { leerdoelId: "breuken-vergelijken", onderdeelId: "breuken-vergelijken", onderwerpId: "breuken", niveau: "past-bij-mij", aantal: 8, bron: "zelf" });
  const klaar = speelUit(data, sessie.id, [1]);
  assert.equal(klaar.sessies[sessie.id].status, "afgerond");
});

console.log(`\n${geslaagd} tests geslaagd`);
