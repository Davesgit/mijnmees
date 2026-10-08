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
import { beoordeelTutorhulp, controleUitkomst, kiesControleVraag } from "@/features/tutorhulp/criteria";
import { bordOp, type BordOpname } from "@/features/tutorhulp/bord";
import type { Poging } from "@/features/oefenen/types";
import { kiesWerkbladVragen, maakWerkblad, type WerkbladInstellingen } from "@/features/werkbladen/werkblad";

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

console.log("Werkbladen");
const wb: WerkbladInstellingen = { vak: "rekenen", onderwerpen: ["breuken", "tafels"], niveau: "past-bij-mij", tafels: [3, 7], bewerkingen: ["x", ":"], aantal: 12, seed: 42 };
test("werkblad: zelfde seed geeft hetzelfde blad als het voorbeeld", () => {
  assert.deepEqual(kiesWerkbladVragen(wb), kiesWerkbladVragen({ ...wb }));
  assert.deepEqual(maakWerkblad(wb).vragen.map((v) => v.vraagId), kiesWerkbladVragen(wb));
  assert.notDeepEqual(kiesWerkbladVragen(wb), kiesWerkbladVragen({ ...wb, seed: 43 }));
});
test("werkblad: juiste aantal, geen dubbele, alleen gekozen tafels", () => {
  for (const aantal of [4, 12, 20]) {
    const ids = kiesWerkbladVragen({ ...wb, aantal });
    assert.equal(ids.length, aantal);
    assert.equal(new Set(ids).size, aantal);
    for (const id of ids) {
      const v = vindVraag(id);
      assert.ok(v && v.soort !== "europa", id);
      if (v.soort === "tafel") assert.ok(v.tafel === 3 || v.tafel === 7, id);
    }
  }
  assert.match(maakWerkblad(wb).code, /^WB-[A-Z0-9]{6}$/);
});

console.log("Tutorhulp");
{
  const nu = new Date("2026-10-10T12:00:00Z");
  const dag = (d: number) => new Date(nu.getTime() - d * 86_400_000).toISOString();
  const slot = (id: string, vraagId: string, uitkomst: "zelfstandig" | "met-hulp" | "met-uitleg", herhalingVan?: string) => ({
    id, vraagId, vraagVersie: 1, hulp: { hints: 2 as const, uitleg: uitkomst === "met-uitleg", fouten: 3 }, uitkomst, ...(herhalingVan ? { herhalingVan } : {}),
  });
  const sessie = (id: string, op: string, slots: ReturnType<typeof slot>[], extra: Partial<Sessie> = {}): Sessie => ({
    id, soort: "tafels", leerdoelId: "tafels", onderdeelId: "tafels", onderwerpId: "tafels", niveau: "past-bij-mij", aantal: slots.length, bron: "zelf", slots, index: 0, versie: 1, status: "afgerond", gestartOp: op, ...extra,
  });
  const poging = (sessieId: string, slotId: string, vraagId: string, op: string, resultaat: "goed" | "fout" = "goed", hints = 0, uitleg = false): Poging => ({
    eventId: `${sessieId}-${slotId}-${op}-${resultaat}`, sessieId, slotId, vraagId, vraagVersie: 1, leerdoelId: vindVraag(vraagId)!.learningGoalId, antwoord: "1", resultaat, eerstePoging: true, hulpVooraf: { hints, uitleg }, op,
  });
  const A = sessie("a", dag(3), [slot("s1", "tafel-7-x-8", "met-uitleg"), slot("s2", "tafel-7-x-6", "met-hulp", "s1")]);
  const B = sessie("b", dag(1), [slot("s3", "tafel-7-x-9", "met-uitleg")]);
  const pogA = [poging("a", "s1", "tafel-7-x-8", dag(3)), poging("a", "s2", "tafel-7-x-6", dag(3))];
  const pogB = [poging("b", "s3", "tafel-7-x-9", dag(1))];

  test("tutorhulp pas na twee dagen vastlopen én een niet-zelfstandige soortgelijke vraag", () => {
    assert.equal(beoordeelTutorhulp({ sessies: [A, B], pogingen: [...pogA, ...pogB] }, "tafel-7", nu).geschikt, true);
    const eenDag = beoordeelTutorhulp({ sessies: [A], pogingen: pogA }, "tafel-7", nu);
    assert.equal(eenDag.geschikt, false);
    assert.ok(eenDag.ontbreekt.some((o) => o.includes("andere dag")));
    const zonderVervolg = sessie("a", dag(3), [slot("s1", "tafel-7-x-8", "met-uitleg")]);
    assert.equal(beoordeelTutorhulp({ sessies: [zonderVervolg, B], pogingen: [pogA[0], ...pogB] }, "tafel-7", nu).geschikt, false);
    assert.equal(beoordeelTutorhulp({ sessies: [A, B], pogingen: [...pogA, ...pogB] }, "europa-landen", nu).geschikt, false);
  });
  test("oude pogingen (buiten de periode) tellen niet", () => {
    const oud = (p: Poging) => ({ ...p, op: dag(60) });
    assert.equal(beoordeelTutorhulp({ sessies: [A, B], pogingen: [...pogA.map(oud), ...pogB] }, "tafel-7", nu).geschikt, false);
  });
  test("controlevraag: nieuw voor het kind; uitkomst volgt uit servernagekeken pogingen", () => {
    const gezien = new Set(["tafel-7-x-8", "tafel-7-x-6", "tafel-7-x-9"]);
    for (let i = 0; i < 20; i++) assert.ok(!gezien.has(kiesControleVraag("tafel-7", gezien)!.id));
    const C = sessie("c", dag(0), [slot("s9", "tafel-7-x-3", "zelfstandig")], { soort: "controle", instellingen: { controleVoor: "h1" } });
    assert.equal(controleUitkomst([C], [poging("c", "s9", "tafel-7-x-3", dag(0))], "h1", "tafel-7-x-3"), "zelfstandig");
    assert.equal(controleUitkomst([C], [poging("c", "s9", "tafel-7-x-3", dag(0), "fout"), poging("c", "s9", "tafel-7-x-3", dag(-0.01), "goed", 1)], "h1", "tafel-7-x-3"), "met-hulp");
    assert.equal(controleUitkomst([C], [], "h1", "tafel-7-x-3"), null);
    assert.equal(controleUitkomst([C], [poging("c", "s9", "tafel-7-x-3", dag(0))], "ander", "tafel-7-x-3"), null);
  });
  test("bord: afspelen volgt de tijdlijn", () => {
    const tekst = (id: string, t: string) => ({ id, kleur: "inkt" as const, soort: "tekst" as const, x: 10, y: 10, tekst: t, groot: false });
    const opname: BordOpname = {
      elementen: [tekst("a", "start")],
      gebeurtenissen: [
        { t: 1000, op: "plaats", element: tekst("b", "twee") },
        { t: 2000, op: "plaats", element: tekst("a", "anders") },
        { t: 3000, op: "verwijder", id: "b" },
        { t: 4000, op: "zet", elementen: [] },
      ],
    };
    assert.equal(bordOp(opname, 500).length, 1);
    assert.equal(bordOp(opname, 1500).length, 2);
    assert.equal((bordOp(opname, 2500)[0] as { tekst: string }).tekst, "anders");
    assert.equal(bordOp(opname, 3500).length, 1);
    assert.equal(bordOp(opname, 5000).length, 0);
  });
}

console.log(`\n${geslaagd} tests geslaagd`);
