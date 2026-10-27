import europaNamenJson from "../src/content/europa/namen.json";
import europaVragen from "../src/content/europa/vragen.json";
import { kaart as europaKaart } from "../src/features/europa/kaart";
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
  niveauVoorGroep,
  registreerAntwoord,
  startNiveau,
  sessieStatistiek,
  vraagHulp,
  werkPuzzelBij,
} from "@/features/oefenen/sessie";
import type { OpslagData, Sessie } from "@/features/oefenen/types";
import { isGoed, vindVraag } from "@/features/oefenen/vragen";
import { amsterdamNaarUtc, kanMeedoen, kanStarten, lesSignalen, modereerVraag } from "@/features/live/regels";
import { bordInStukjes, decodeer } from "@/features/live/bordkanaal";
import { beoordeelTutorhulp, controleUitkomst, kiesControleVraag } from "@/features/tutorhulp/criteria";
import { bordOp, type BordOpname } from "@/features/tutorhulp/bord";
import type { Poging } from "@/features/oefenen/types";
import { antwoord, bewaarGesprek, groepVraag, herken, leesGroep, reageer, tafelsUit, maakTitel, MAX_GESPREKKEN, type Gesprek } from "@/features/chat/gesprek";
import { antwoordOpties, faseVan, kanInChat, leesAntwoord, leesOpdracht, oefenTeller, verloopVanSlot } from "@/features/chat/oefen-verloop";
import { namen as europaNamenMap } from "@/features/oefenen/europa-vragen";
import { doelVoortgang, tafelOverzicht, voortgangSamenvatting, voortgangSoorten, voortgangVan, voortgangVoorstellen } from "@/features/chat/voortgang-chat";
import { antwoordOuder, herkenOuder, reageerOuder, weekZin, type OuderKind } from "@/features/ouderchat/ouder-gesprek";
import { berekenBewijs } from "@/features/voortgang/bewijs";
import { appDoorsturing, isAppVerzoek } from "@/features/app/appmodus";
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
  assert.equal(klaar.weetjes.length, 0, "geen weetjes meer als beloning");
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

console.log("Live-lessen");
test("Nederlandse tijd → UTC, ook rond zomer- en wintertijd", () => {
  assert.equal(amsterdamNaarUtc("2026-07-01T15:30"), "2026-07-01T13:30:00.000Z");
  assert.equal(amsterdamNaarUtc("2026-12-01T15:30"), "2026-12-01T14:30:00.000Z");
  assert.equal(amsterdamNaarUtc("2026-10-25T12:00"), "2026-10-25T11:00:00.000Z");
  assert.equal(amsterdamNaarUtc("onzin"), null);
});
test("startvenster en meedoen", () => {
  const start = "2026-10-20T14:00:00.000Z", t = (m: number) => Date.parse(start) + m * 60_000;
  assert.equal(kanStarten(start, 20, t(-20)), false);
  assert.equal(kanStarten(start, 20, t(-10)), true);
  assert.equal(kanStarten(start, 20, t(60)), false);
  assert.equal(kanMeedoen("live", start, 20, t(30)), true);
  assert.equal(kanMeedoen("gepland", start, 20, t(5)), false);
  assert.equal(kanMeedoen("live", start, 20, t(80)), false);
});
test("privévragen met contactgegevens gaan apart", () => {
  assert.equal(modereerVraag("Waarom is 3/4 groter dan 2/3?").status, "nieuw");
  assert.equal(modereerVraag("mail me op sam@voorbeeld.nl").status, "apart");
  assert.equal(modereerVraag("bel 06 12345678").status, "apart");
  assert.equal(modereerVraag("kijk op www.site.com").status, "apart");
  assert.equal(modereerVraag("wat is je snapchat").status, "apart");
});
test("lesvoorstel vanaf 3 verschillende kinderen binnen 14 dagen", () => {
  const nu = Date.parse("2026-10-20T12:00:00Z"), d = (n: number) => new Date(nu - n * 86_400_000).toISOString();
  const p = (kindId: string, leerdoelId: string, op: string) => ({ kindId, leerdoelId, op });
  assert.equal(lesSignalen([p("a", "tafel-7", d(1)), p("a", "tafel-7", d(2)), p("b", "tafel-7", d(3))], nu).length, 0);
  assert.deepEqual(lesSignalen([p("a", "tafel-7", d(1)), p("b", "tafel-7", d(3)), p("c", "tafel-7", d(13))], nu).map((s) => s.kinderen.length), [3]);
  assert.equal(lesSignalen([p("a", "tafel-7", d(1)), p("b", "tafel-7", d(3)), p("c", "tafel-7", d(20))], nu).length, 0);
});
test("groot bord gaat in stukjes die elk passen en samen het hele bord vormen", () => {
  const pen = (i: number) => ({ id: `p${i}`, kleur: "inkt" as const, soort: "pen" as const, punten: Array.from({ length: 500 }, (_, k): [number, number] => [k % 1000, (k * 7) % 625]) });
  const elementen = Array.from({ length: 40 }, (_, i) => pen(i));
  const stukjes = bordInStukjes(elementen);
  assert.ok(stukjes.every((b) => b.byteLength <= 12_000));
  let bord: unknown[] = [];
  for (const b of stukjes) {
    const m = decodeer(b);
    assert.ok(m && m.soort === "bord");
    if (m.g.op === "zet") bord = m.g.elementen;
    else if (m.g.op === "plaats") bord = [...bord, m.g.element];
  }
  assert.equal(bord.length, 40);
});

const europaNamen = europaNamenJson as Record<string, string>;
console.log("Europa-inhoud");
test("landnamen worden nooit overschreven door antwoordopties (Zweden ≠ Zuidoost)", () => {
  for (const l of europaKaart.landen) assert.equal(europaNamen[l.id], l.naam, l.id);
  assert.equal(europaNamen.SE, "Zweden");
  for (const q of europaVragen as { opties?: { id: string; label: string }[] }[]) for (const o of q.opties ?? []) assert.equal(europaNamen[o.id], o.label, `optie ${o.id}`);
});

test("app-modus: herkenning en doorsturen", () => {
  assert.equal(isAppVerzoek("Mozilla/5.0 (iPhone) MeesApp/1.0", undefined), true);
  assert.equal(isAppVerzoek("Mozilla/5.0 (iPhone)", "1"), true);
  assert.equal(isAppVerzoek("Mozilla/5.0 (iPhone)", undefined), false);
  assert.equal(appDoorsturing("/"), "/kind/start");
  for (const pad of ["/donateurs", "/donateurs/transparantie", "/tutoren", "/tutor/lessen", "/beheer", "/over-mees"]) assert.equal(appDoorsturing(pad), "/kind/start", pad);
  for (const pad of ["/kind/start", "/ouder", "/profielen", "/privacy", "/tutorial", "/api/voorlezen"]) assert.equal(appDoorsturing(pad), null, pad);
});

test("chat: onderwerpen herkennen en antwoorden met vaste keuzes", () => {
  assert.equal(herken("Ik wil de tafel van 7 oefenen"), "tafels");
  assert.equal(herken("Wat is de hoofdstad van Italië?"), "europa");
  assert.equal(herken("hoe werken breuken"), "rekenen");
  assert.equal(herken("Soms ben ik moe"), "onbekend");
  assert.equal(herken("Hoi Mees"), "groet");
  const ctx = { open: null, voorstel: "Breuken vergelijken", voorstelId: "doel:breuken-vergelijken", aantal: 6 };
  assert.equal(antwoord("oefenen", ctx).keuzes?.[0]?.soort, "voorstel");
  assert.equal(antwoord("oefenen", { ...ctx, open: "Tafels" }).keuzes?.[0]?.soort, "hervat");
  // Alles blijft in de chat: geen enkele keuze stuurt naar een andere pagina.
  for (const o of ["leren", "oefenen", "rekenen", "tafels", "europa", "werkblad", "voortgang", "groet", "onbekend"] as const)
    for (const k of antwoord(o, ctx).keuzes ?? []) assert.notEqual(k.soort, "ga", `${o}: ${k.label}`);
  assert.equal(reageer("Wat is de hoofdstad van Italië?", ctx).kaart?.soort, "europa");
  assert.equal(reageer("ik wil een landenpuzzel", ctx).kaart?.soort, "europa");
  assert.deepEqual(tafelsUit("ik wil de tafel van 7 en 12 trainen"), [7, 12]);
  assert.deepEqual(reageer("ik wil tafels trainen", ctx).kaart, { soort: "tafels", tafels: [] });
  assert.deepEqual(reageer("tafel van 8", ctx).kaart, { soort: "tafels", tafels: [8] });
  // Voortgang: eerst kiezen waarvan (hier nog niets geoefend, dus een uitnodiging om te oefenen).
  assert.match(reageer("wat heb ik al geoefend", ctx).tekst, /nog niet geoefend/);
  assert.match(reageer("Wat is de hoofdstad van Frankrijk?", ctx).tekst, /nog geen eigen antwoord/);
  assert.doesNotMatch(reageer("Ik wil Europa oefenen", ctx).tekst, /nog geen eigen antwoord/);
  assert.equal(maakTitel("  a  b "), "a b");
  assert.ok(maakTitel("x".repeat(80)).length <= 40);
  let lijst: Gesprek[] = [];
  for (let i = 0; i < MAX_GESPREKKEN + 5; i++) lijst = bewaarGesprek(lijst, { id: String(i), titel: "", berichten: [], bijgewerkt: i });
  assert.equal(lijst.length, MAX_GESPREKKEN);
  assert.equal(lijst[0]?.id, String(MAX_GESPREKKEN + 4));
});

test("chat-oefenen: verloop uit de opslag (fout, hint, goed) en teller", () => {
  const start = maakSessie(leeg(), { leerdoelId: "breuken-vergelijken", onderdeelId: "breuken-vergelijken", onderwerpId: "breuken", niveau: "past-bij-mij", aantal: 4, bron: "voorstel" });
  const sessie = start.sessie;
  let data = start.data;
  const id = sessie.id;
  const slot = () => data.sessies[id]!.slots[data.sessies[id]!.index]!;
  const verloop = () => verloopVanSlot(slot(), data.pogingen.filter((p) => p.slotId === slot().id)).map((s) => s.soort + (s.soort === "fout" ? `:${s.hulp?.soort ?? "-"}` : s.soort === "vraag" ? `:${s.status}` : ""));
  assert.deepEqual(verloop(), ["vraag:open"]);
  const fout = ["<", "=", ">"].find((t) => t !== goedAntwoord(data.sessies[id]!))!;
  data = registreerAntwoord(data, id, fout)!.data;
  assert.deepEqual(verloop(), ["vraag:fout", "fout:-", "vraag:open"]);
  data = vraagHulp(data, id);
  // Hulp gevraagd: de vraag blijft staan, daaronder het verzoek, de hint en dezelfde vraag opnieuw.
  assert.deepEqual(verloop(), ["vraag:fout", "fout:-", "vraag:hulp", "hulpVraag", "hulp", "vraag:open"]);
  data = registreerAntwoord(data, id, fout)!.data;
  // Hint 1 had het kind al gevraagd: na de tweede fout geen dubbele hint.
  assert.deepEqual(verloop(), ["vraag:fout", "fout:-", "vraag:hulp", "hulpVraag", "hulp", "vraag:fout", "fout:-", "vraag:open"]);
  data = registreerAntwoord(data, id, goedAntwoord(data.sessies[id]!))!.data;
  assert.deepEqual(verloop(), ["vraag:fout", "fout:-", "vraag:hulp", "hulpVraag", "hulp", "vraag:fout", "fout:-", "vraag:goed", "goed"]);
  // Goed antwoord telt meteen; een fout of hint telt niet als afgeronde vraag.
  assert.equal(oefenTeller(data.sessies[id]!).klaar, 1);
  assert.equal(kanInChat(data.sessies[id]!), true);
  assert.equal(kanInChat({ ...data.sessies[id]!, soort: "europa" }), true);
  assert.equal(kanInChat({ ...data.sessies[id]!, soort: "niveau" }), false);
  assert.equal(kanInChat({ ...data.sessies[id]!, soort: "tafels", instellingen: { metTijd: true } }), true);
});

test("chat-oefenen: vier fouten geven de uitleg en daarna Verder", () => {
  const start = maakSessie(leeg(), { leerdoelId: "breuken-vergelijken", onderdeelId: "breuken-vergelijken", onderwerpId: "breuken", niveau: "past-bij-mij", aantal: 4, bron: "voorstel" });
  const sessie = start.sessie;
  let data = start.data;
  const id = sessie.id;
  const fout = ["<", "=", ">"].find((t) => t !== goedAntwoord(data.sessies[id]!))!;
  for (let i = 0; i < 4; i++) data = registreerAntwoord(data, id, fout)!.data;
  const s = data.sessies[id]!.slots[0]!;
  const stappen = verloopVanSlot(s, data.pogingen.filter((p) => p.slotId === s.id));
  assert.deepEqual(stappen.filter((x) => x.soort === "fout").map((x) => (x.soort === "fout" ? x.hulp?.soort ?? "-" : "")), ["-", "hint", "hint", "uitleg"]);
  assert.equal(stappen.at(-1)?.soort, "verder");
});

test("chatbalk: getypte antwoorden en opdrachten begrijpen", () => {
  assert.equal(leesOpdracht("Geef me een hint"), "hint");
  assert.equal(leesOpdracht("ik snap het niet"), "hint");
  assert.equal(leesOpdracht("even pauze!"), "pauze");
  assert.equal(leesOpdracht("volgende vraag"), "verder");
  assert.equal(leesOpdracht("hoe deel je door 4"), null);
  const breuk = maakSessie(leeg(), { leerdoelId: "breuken-vergelijken", onderdeelId: "breuken-vergelijken", onderwerpId: "breuken", niveau: "past-bij-mij", aantal: 4, bron: "voorstel" });
  const bslot = breuk.sessie.slots[0]!;
  const bvraag = vindVraag(bslot.vraagId)!;
  assert.equal(leesAntwoord("<", bvraag, bslot, europaNamenMap), "<");
  assert.equal(leesAntwoord("Groter", bvraag, bslot, europaNamenMap), ">");
  assert.equal(leesAntwoord("is gelijk", bvraag, bslot, europaNamenMap), "=");
  assert.equal(leesAntwoord("wat is een breuk", bvraag, bslot, europaNamenMap), null);
  assert.deepEqual(antwoordOpties(bvraag, bslot).map((o) => o.waarde), bvraag.soort === "breuk" ? bvraag.options : []);
  const tafel = maakTafelSessie(leeg(), { tafels: [7], bewerkingen: ["x"], aantal: 4, metTijd: false, bron: "zelf" });
  const tslot = tafel.sessie.slots[0]!;
  const tvraag = vindVraag(tslot.vraagId)!;
  assert.equal(leesAntwoord("42", tvraag, tslot, europaNamenMap), "42");
  assert.equal(leesAntwoord("het is 42", tvraag, tslot, europaNamenMap), "42");
  assert.equal(leesAntwoord("veertig", tvraag, tslot, europaNamenMap), null);
  assert.equal(antwoordOpties(tvraag, tslot).length, 0);
  const eu = maakEuropaSessie(leeg(), { gebieden: ["west"], landen: landenVanGebieden(["west"]), onderwerpen: ["landen"], vorm: "afwisselend" });
  const kaartSlot = eu.sessie.slots.find((sl) => (vindVraag(sl.vraagId) as { type?: string })?.type === "map-click")!;
  const kaartVraag = vindVraag(kaartSlot.vraagId)!;
  assert.equal(leesAntwoord("frankrijk", kaartVraag, kaartSlot, europaNamenMap), "FR");
  const keuzeSlot = eu.sessie.slots.find((sl) => (vindVraag(sl.vraagId) as { type?: string })?.type === "choice");
  if (keuzeSlot) {
    const keuzeVraag = vindVraag(keuzeSlot.vraagId)!;
    const optie = antwoordOpties(keuzeVraag, keuzeSlot)[0]!;
    assert.equal(leesAntwoord(optie.label.toUpperCase(), keuzeVraag, keuzeSlot, europaNamenMap), optie.waarde);
  }
  assert.equal(faseVan(bslot), "antwoorden");
});

test("chat-voortgang: eerst kiezen, dan samenvatting en voorstellen", () => {
  const ctx = { open: null, voorstel: "x", voorstelId: "x", aantal: 6 };
  // Nog niets geoefend: geen keuzes van onderdelen, wel uitnodigen om te oefenen.
  assert.equal(voortgangSoorten(leeg()).length, 0);
  assert.equal(antwoord("voortgang", { ...ctx, voortgang: [] }).keuzes?.[0]?.soort, "vervolg");
  // Twee rondjes tafel van 7 (allemaal goed) en één rondje tafel van 8 met hulp.
  let data = leeg();
  for (let i = 0; i < 2; i++) {
    const r = maakTafelSessie(data, { tafels: [7], bewerkingen: ["x"], aantal: 8, metTijd: false, bron: "zelf" });
    data = speelUit(r.data, r.sessie.id);
  }
  const r8 = maakTafelSessie(data, { tafels: [8], bewerkingen: ["x"], aantal: 4, metTijd: false, bron: "zelf" });
  data = speelUit(r8.data, r8.sessie.id, [0]);
  assert.deepEqual(voortgangSoorten(data), ["tafels"]);
  const keuzes = antwoord("voortgang", { ...ctx, voortgang: voortgangSoorten(data) }).keuzes ?? [];
  assert.deepEqual(keuzes.map((k) => k.label), ["Tafels"], "één onderdeel: geen 'Alles'");
  const items = voortgangVan(data, "tafels");
  assert.equal(items.at(-1)?.status, "gaat-zelfstandig", "zelfstandig staat onderaan");
  const tekst = voortgangSamenvatting(items, "tafels");
  assert.match(tekst, /^Bij de tafels zie ik dit\. Knap! De tafel van 7 gaat al zelfstandig\./);
  assert.match(tekst, /de tafel van 8/);
  assert.deepEqual(voortgangVoorstellen(items).map((k) => k.label), ["De tafel van 8 oefenen"]);
  assert.equal(voortgangVan(data, "europa").length, 0);
  // Doel per onderdeel: zelfstandig is gehaald; de tafel van 8 (één oefenmoment) heeft nog iets nodig.
  const t7 = items.find((b) => b.leerdoelId === "tafel-7")!;
  const t8 = items.find((b) => b.leerdoelId === "tafel-8")!;
  assert.deepEqual(doelVoortgang(t7), { deel: 1, tekst: "Gehaald! ⭐" });
  assert.ok(doelVoortgang(t8).deel < 1 && /nog één oefenmoment tot ⭐/.test(doelVoortgang(t8).tekst), doelVoortgang(t8).tekst);
  // Tafeloverzicht: 12 vakjes voor keer; geen rij voor delen (niet geoefend).
  const overzicht = tafelOverzicht(items);
  assert.equal(overzicht.keer?.length, 12);
  assert.equal(overzicht.keer?.[6]?.status, "gaat-zelfstandig");
  assert.equal(overzicht.keer?.[0]?.status, null);
  assert.equal(overzicht.delen, null);
  assert.match(voortgangSamenvatting([], "europa"), /nog niet geoefend/);
});

test("ouderchat: voortgang per kind, samenvatting en suggesties voor ouders", () => {
  let data = leeg();
  const r8 = maakTafelSessie(data, { tafels: [8], bewerkingen: ["x"], aantal: 4, metTijd: false, bron: "zelf" });
  data = speelUit(r8.data, r8.sessie.id, [0]);
  const sam: OuderKind = { id: "k1", voornaam: "Sam", bewijs: berekenBewijs(data), week: { momenten: 1, vragen: 4, zelfGoed: 3 } };
  const lot: OuderKind = { id: "k2", voornaam: "Lot", bewijs: [], week: { momenten: 0, vragen: 0, zelfGoed: 0 } };
  // Herkennen
  assert.deepEqual(herkenOuder("Hoe gaat het met Sam?", [sam, lot]), { stap: "voortgang", kindId: "k1", filter: undefined });
  assert.deepEqual(herkenOuder("tips voor de tafels", [sam]), { stap: "tips", soort: "tafels" });
  assert.equal(herkenOuder("waar kan ik de privacy regelen", [sam])?.stap, "instellingen");
  assert.equal(reageerOuder("wat is het weer", [sam]).keuzes?.length, 3);
  // Twee kinderen: eerst kiezen wie
  assert.deepEqual(antwoordOuder({ stap: "voortgang" }, [sam, lot]).keuzes?.map((k) => k.label), ["Sam", "Lot"]);
  // Eén onderdeel geoefend: meteen de samenvatting met de week en suggesties
  const a = antwoordOuder({ stap: "voortgang", kindId: "k1" }, [sam, lot]);
  assert.match(a.tekst, /^Met de tafel van 8 is Sam nog aan het oefenen\./);
  assert.deepEqual(a.kaart, { soort: "ouderVoortgang", kindId: "k1", filter: "tafels" });
  assert.deepEqual(a.keuzes?.map((k) => k.label), ["Tips voor de tafel van 8", "Werkblad: de tafel van 8", "Laat Sam oefenen", "Ander kind"]);
  // Nog niet geoefend
  assert.match(antwoordOuder({ stap: "voortgang", kindId: "k2" }, [sam, lot]).tekst, /^Lot heeft de afgelopen week niet geoefend\./);
  assert.equal(weekZin(sam), "Sam heeft de afgelopen week één keer geoefend: 4 vragen, waarvan 3 in één keer zelf goed.");
  // Tips
  assert.match(antwoordOuder({ stap: "tips", leerdoelId: "tafel-8" }, [sam]).tekst, /^Zo kun je thuis helpen met de tafel van 8:/);
  assert.equal(antwoordOuder({ stap: "tips" }, [sam]).keuzes?.length, 3);
});

test("groep: beginniveau, aanpassen na een rondje en de groep herkennen", () => {
  assert.equal(niveauVoorGroep(5), "makkelijk");
  assert.equal(niveauVoorGroep(7), "past-bij-mij");
  assert.equal(niveauVoorGroep(8), "uitdagend");
  assert.equal(niveauVoorGroep(0), "past-bij-mij");
  const instelling = { leerdoelId: "breuken-vergelijken", onderdeelId: "x", onderwerpId: "y", aantal: 4, bron: "voorstel" as const };
  // Eerste rondje: de groep telt. Alles zelf goed: een niveau hoger. Steeds hulp nodig: een niveau lager.
  assert.equal(startNiveau(leeg(), "breuken-vergelijken", 6), "makkelijk");
  const goed = maakSessie(leeg(), { ...instelling, niveau: "makkelijk" });
  assert.equal(startNiveau(speelUit(goed.data, goed.sessie.id), "breuken-vergelijken", 6), "past-bij-mij");
  const moeilijk = maakSessie(leeg(), { ...instelling, niveau: "uitdagend" });
  assert.equal(startNiveau(speelUit(moeilijk.data, moeilijk.sessie.id, [0, 1, 2, 3, 4, 5, 6, 7]), "breuken-vergelijken", 8), "past-bij-mij");
  // De groep herkennen
  assert.equal(leesGroep("ik zit in groep 7"), 7);
  assert.equal(leesGroep("6"), null);
  assert.equal(leesGroep("6", true), 6);
  assert.equal(leesGroep("weet ik niet", true), 0);
  assert.equal(leesGroep("tafel van 6", true), null);
  assert.deepEqual(groepVraag("hoi").keuzes?.map((k) => k.label), ["Groep 5", "Groep 6", "Groep 7", "Groep 8", "Weet ik niet"]);
  assert.match(antwoord("rekenen", { open: null, voorstel: "", voorstelId: "", aantal: 4, groep: 5 }).tekst, /groep 5, dus ik begin met makkelijkere vragen/);
  assert.match(antwoord("europa", { open: null, voorstel: "", voorstelId: "", aantal: 4, groep: 6 }).tekst, /meestal in groep 7 en 8/);
});

console.log(`\n${geslaagd} tests geslaagd`);
