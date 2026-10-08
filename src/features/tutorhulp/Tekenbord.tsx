"use client";

import { useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { Melding } from "@/components/mees/Bouwstenen";
import { SecundaireKnop } from "@/components/mees/Knoppen";
import { BordWeergave } from "./BordWeergave";
import {
  BORD,
  bordKleuren,
  bordLimieten,
  nieuwElementId,
  omschrijf,
  pasGebeurtenisToe,
  verschuif,
  type BordElement,
  type BordGebeurtenis,
  type BordKleur,
} from "./bord";

/** Een bordwijziging zonder tijdstip; de gebruiker (opname of live-les) bepaalt wat ermee gebeurt. */
type ZonderT<G> = G extends unknown ? Omit<G, "t"> : never;
export type ZonderTijd = ZonderT<BordGebeurtenis>;

type Gereedschap = "kies" | "pen" | "pijl" | "rechthoek" | "cirkel";

const gereedschappen: { id: Gereedschap; naam: string }[] = [
  { id: "kies", naam: "Kies en verplaats" },
  { id: "pen", naam: "Tekenen" },
  { id: "pijl", naam: "Pijl" },
  { id: "rechthoek", naam: "Strook" },
  { id: "cirkel", naam: "Cirkel" },
];

/** Raakt punt (x, y) dit element? Ruim gemeten, zodat het ook met een vinger lukt. */
function raak(e: BordElement, x: number, y: number) {
  const m = 18;
  switch (e.soort) {
    case "tekst":
      return x >= e.x - m && x <= e.x + e.tekst.length * (e.groot ? 30 : 20) + m && Math.abs(y - e.y) <= (e.groot ? 34 : 24);
    case "breuk":
      return Math.abs(x - e.x) <= 60 && y >= e.y - 64 && y <= e.y + 64;
    case "rechthoek":
      return x >= e.x - m && x <= e.x + e.b + m && y >= e.y - m && y <= e.y + e.h + m;
    case "cirkel":
      return Math.hypot(x - e.x, y - e.y) <= e.r + m;
    case "pijl": {
      const [dx, dy] = [e.x2 - e.x1, e.y2 - e.y1];
      const l = dx * dx + dy * dy || 1;
      const t = Math.max(0, Math.min(1, ((x - e.x1) * dx + (y - e.y1) * dy) / l));
      return Math.hypot(x - (e.x1 + t * dx), y - (e.y1 + t * dy)) <= m;
    }
    case "pen":
      return e.punten.some(([px, py]) => Math.hypot(x - px, y - py) <= m);
  }
}

/**
 * Tekenbord voor tutors: getypte tekst, breuken, stroken en cirkels in delen, pijlen en vrij tekenen.
 * Elke wijziging gaat via onGebeurtenis naar de opname (uitleg) of naar de kinderen (live-les).
 */
export function Tekenbord({
  begin,
  onGebeurtenis,
  uitgeschakeld = false,
  rand = "",
}: {
  begin: BordElement[];
  onGebeurtenis: (g: ZonderTijd, na: BordElement[]) => void;
  uitgeschakeld?: boolean;
  rand?: string;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [elementen, setElementen] = useState<BordElement[]>(begin);
  const [terug, setTerug] = useState<BordElement[][]>([]);
  const [vooruit, setVooruit] = useState<BordElement[][]>([]);
  const [gereedschap, setGereedschap] = useState<Gereedschap>("kies");
  const [kleur, setKleur] = useState<BordKleur>("inkt");
  const [geselecteerd, setGeselecteerd] = useState<string | null>(null);
  const [concept, setConcept] = useState<BordElement | null>(null);
  const [vol, setVol] = useState(false);
  const sleep = useRef<{ start: [number, number]; origineel?: BordElement; verplaatst?: BordElement } | null>(null);

  const [tekst, setTekst] = useState("");
  const [groot, setGroot] = useState(false);
  const [teller, setTeller] = useState("");
  const [noemer, setNoemer] = useState("");

  function wijzig(volgende: BordElement[], g: ZonderTijd) {
    if (volgende.length > bordLimieten.elementen) {
      setVol(true);
      return;
    }
    setTerug((s) => [...s.slice(-50), elementen]);
    setVooruit([]);
    setElementen(volgende);
    setVol(false);
    onGebeurtenis(g, volgende);
  }
  const plaats = (e: BordElement) => wijzig(pasGebeurtenisToe(elementen, { t: 0, op: "plaats", element: e }), { op: "plaats", element: e });
  const verwijder = (id: string) => {
    wijzig(elementen.filter((e) => e.id !== id), { op: "verwijder", id });
    setGeselecteerd(null);
  };
  const zet = (nieuw: BordElement[]) => wijzig(nieuw, { op: "zet", elementen: nieuw });

  function ongedaan() {
    const vorige = terug.at(-1);
    if (!vorige) return;
    setTerug((s) => s.slice(0, -1));
    setVooruit((s) => [...s, elementen]);
    setElementen(vorige);
    onGebeurtenis({ op: "zet", elementen: vorige }, vorige);
  }
  function opnieuw() {
    const volgende = vooruit.at(-1);
    if (!volgende) return;
    setVooruit((s) => s.slice(0, -1));
    setTerug((s) => [...s, elementen]);
    setElementen(volgende);
    onGebeurtenis({ op: "zet", elementen: volgende }, volgende);
  }

  /* ---------- Aanwijzen en tekenen ---------- */

  function punt(e: ReactPointerEvent<SVGSVGElement>): [number, number] {
    const svg = svgRef.current!;
    const r = svg.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * BORD.breedte;
    const y = ((e.clientY - r.top) / r.height) * BORD.hoogte;
    return [Math.round(Math.max(0, Math.min(BORD.breedte, x))), Math.round(Math.max(0, Math.min(BORD.hoogte, y)))];
  }

  function omlaag(e: ReactPointerEvent<SVGSVGElement>) {
    if (uitgeschakeld) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const [x, y] = punt(e);
    if (gereedschap === "kies") {
      const raakt = [...elementen].reverse().find((el) => raak(el, x, y));
      setGeselecteerd(raakt?.id ?? null);
      sleep.current = raakt ? { start: [x, y], origineel: raakt } : null;
      return;
    }
    const id = nieuwElementId();
    sleep.current = { start: [x, y] };
    if (gereedschap === "pen") setConcept({ id, kleur, soort: "pen", punten: [[x, y]] });
    if (gereedschap === "pijl") setConcept({ id, kleur, soort: "pijl", x1: x, y1: y, x2: x, y2: y });
    if (gereedschap === "rechthoek") setConcept({ id, kleur, soort: "rechthoek", x, y, b: 4, h: 4, delen: 1, gevuld: 0 });
    if (gereedschap === "cirkel") setConcept({ id, kleur, soort: "cirkel", x, y, r: 4, delen: 1, gevuld: 0 });
  }

  function beweeg(e: ReactPointerEvent<SVGSVGElement>) {
    const s = sleep.current;
    if (!s) return;
    const [x, y] = punt(e);
    if (gereedschap === "kies" && s.origineel) {
      const verplaatst = verschuif(s.origineel, x - s.start[0], y - s.start[1]);
      s.verplaatst = verplaatst;
      setElementen((huidig) => huidig.map((el) => (el.id === verplaatst.id ? verplaatst : el)));
      return;
    }
    setConcept((c) => {
      if (!c) return c;
      switch (c.soort) {
        case "pen": {
          const laatste = c.punten.at(-1)!;
          if (Math.hypot(x - laatste[0], y - laatste[1]) < 4 || c.punten.length >= bordLimieten.penPunten) return c;
          return { ...c, punten: [...c.punten, [x, y]] };
        }
        case "pijl":
          return { ...c, x2: x, y2: y };
        case "rechthoek":
          return { ...c, x: Math.min(x, s.start[0]), y: Math.min(y, s.start[1]), b: Math.max(4, Math.abs(x - s.start[0])), h: Math.max(4, Math.abs(y - s.start[1])) };
        case "cirkel":
          return { ...c, r: Math.max(4, Math.min(400, Math.round(Math.hypot(x - s.start[0], y - s.start[1])))) };
        default:
          return c;
      }
    });
  }

  function omhoog() {
    const s = sleep.current;
    sleep.current = null;
    if (gereedschap === "kies") {
      if (s?.origineel && s.verplaatst) {
        // Verplaatsen telt als één stap: herstel eerst de oorspronkelijke stand voor 'ongedaan maken'.
        const zonder = elementen.map((el) => (el.id === s.origineel!.id ? s.origineel! : el));
        setTerug((t) => [...t.slice(-50), zonder]);
        setVooruit([]);
        onGebeurtenis({ op: "plaats", element: s.verplaatst }, elementen);
      }
      return;
    }
    if (!concept) return;
    const klein = (concept.soort === "rechthoek" && concept.b < 12 && concept.h < 12) || (concept.soort === "cirkel" && concept.r < 10) || (concept.soort === "pijl" && Math.hypot(concept.x2 - concept.x1, concept.y2 - concept.y1) < 15);
    if (!klein) {
      plaats(concept);
      if (concept.soort === "rechthoek" || concept.soort === "cirkel") {
        setGeselecteerd(concept.id);
        setGereedschap("kies");
      }
    }
    setConcept(null);
  }

  /** Nieuwe getypte elementen komen op een vrije plek, zodat het zonder muis kan. */
  function vrijePlek(): [number, number] {
    // Onder het laagste onderdeel; is het bord vol, dan rechts bovenin beginnen.
    const onder = elementen.reduce((max, e) => {
      const y =
        e.soort === "tekst" ? e.y + (e.groot ? 34 : 24) : e.soort === "breuk" ? e.y + 70 : e.soort === "rechthoek" ? e.y + e.h : e.soort === "cirkel" ? e.y + e.r : e.soort === "pijl" ? Math.max(e.y1, e.y2) : Math.max(...e.punten.map((p) => p[1]));
      return Math.max(max, y);
    }, 20);
    return onder + 60 < BORD.hoogte - 60 ? [60, onder + 50] : [560, 80];
  }

  function voegTekstToe() {
    const t = tekst.trim().slice(0, bordLimieten.tekst);
    if (!t) return;
    const [x, y] = vrijePlek();
    const el: BordElement = { id: nieuwElementId(), kleur, soort: "tekst", x, y, tekst: t, groot };
    plaats(el);
    setGeselecteerd(el.id);
    setTekst("");
  }
  function voegBreukToe() {
    const tl = teller.trim().slice(0, 6);
    const nm = noemer.trim().slice(0, 6);
    if (!tl || !nm) return;
    const [x, y] = vrijePlek();
    const el: BordElement = { id: nieuwElementId(), kleur, soort: "breuk", x: x + 40, y: y + 50, teller: tl, noemer: nm };
    plaats(el);
    setGeselecteerd(el.id);
    setTeller("");
    setNoemer("");
  }

  const gekozen = elementen.find((e) => e.id === geselecteerd) ?? null;

  function toetsOpBord(e: KeyboardEvent) {
    if (!gekozen) return;
    const stap = e.shiftKey ? 50 : 10;
    const richting: Record<string, [number, number]> = { ArrowLeft: [-stap, 0], ArrowRight: [stap, 0], ArrowUp: [0, -stap], ArrowDown: [0, stap] };
    if (richting[e.key]) {
      e.preventDefault();
      plaats(verschuif(gekozen, ...richting[e.key]));
    } else if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      verwijder(gekozen.id);
    }
  }

  const knopKlasse = (aan: boolean) =>
    `inline-flex min-h-12 items-center justify-center gap-2 rounded-[12px] border px-3 font-semibold ${aan ? "border-2 border-actie-blauw bg-blauw-zacht text-inkt" : "border-rand-interactief bg-wit text-actie-blauw hover:bg-blauw-zacht"} disabled:opacity-50`;

  return (
    <div className="flex flex-col gap-5">
      {/* Gereedschap */}
      <div role="toolbar" aria-label="Tekenbord" className="flex flex-wrap items-center gap-2">
        {gereedschappen.map((g) => (
          <button key={g.id} type="button" aria-pressed={gereedschap === g.id} onClick={() => setGereedschap(g.id)} className={knopKlasse(gereedschap === g.id)} disabled={uitgeschakeld}>
            {g.naam}
          </button>
        ))}
        <span className="mx-1 hidden h-8 w-px bg-rand-zacht tablet:block" aria-hidden />
        <fieldset className="flex items-center gap-1">
          <legend className="sr-only">Kleur</legend>
          {(Object.keys(bordKleuren) as BordKleur[]).map((k) => (
            <label key={k} className={`grid size-12 cursor-pointer place-items-center rounded-full ${kleur === k ? "ring-3 ring-focus" : ""}`}>
              <input type="radio" name="kleur" className="sr-only" checked={kleur === k} onChange={() => setKleur(k)} />
              <span className="size-8 rounded-full" style={{ background: bordKleuren[k] }} />
              <span className="sr-only">{k}</span>
            </label>
          ))}
        </fieldset>
        <span className="mx-1 hidden h-8 w-px bg-rand-zacht tablet:block" aria-hidden />
        <button type="button" onClick={ongedaan} disabled={!terug.length || uitgeschakeld} className={knopKlasse(false)}>
          Ongedaan maken
        </button>
        <button type="button" onClick={opnieuw} disabled={!vooruit.length || uitgeschakeld} className={knopKlasse(false)}>
          Opnieuw
        </button>
        <button type="button" onClick={() => zet([])} disabled={!elementen.length || uitgeschakeld} className={knopKlasse(false)}>
          Wis bord
        </button>
      </div>

      <div className="grid gap-5 desktop:grid-cols-[1fr_20rem]">
        <div className="flex flex-col gap-2">
          <div tabIndex={0} onKeyDown={toetsOpBord} aria-label="Bord. Kies een onderdeel en verplaats het met de pijltjestoetsen; Delete verwijdert." className="rounded-[16px]">
            <BordWeergave
              svgRef={svgRef}
              elementen={concept ? [...elementen, concept] : elementen}
              geselecteerdId={geselecteerd}
              label={`Tekenbord met ${elementen.length} onderdelen`}
              onPointerDown={omlaag}
              onPointerMove={beweeg}
              onPointerUp={omhoog}
              bezig={gereedschap !== "kies"}
              className={rand}
            />
          </div>
          <p className="tekst-klein text-tekst-zacht">Tip: met Kies en verplaats sleep je onderdelen. Met het toetsenbord: kies een onderdeel in de lijst en gebruik de pijltjes.</p>
        </div>

        <div className="flex flex-col gap-4">
          {/* Getypte tekst en breuken: werkt met alleen een toetsenbord. */}
          <form
            className="flex flex-col gap-2 rounded-[16px] border border-rand-zacht bg-wit p-4"
            onSubmit={(e) => {
              e.preventDefault();
              voegTekstToe();
            }}
          >
            <label className="font-bold" htmlFor="bord-tekst">
              Tekst toevoegen
            </label>
            <input id="bord-tekst" value={tekst} onChange={(e) => setTekst(e.target.value)} maxLength={bordLimieten.tekst} className="min-h-12 rounded-[12px] border border-rand-interactief px-3" />
            <label className="flex min-h-12 items-center gap-2">
              <input type="checkbox" checked={groot} onChange={(e) => setGroot(e.target.checked)} className="size-6 accent-actie-blauw" /> Grote letters
            </label>
            <SecundaireKnop type="submit" disabled={!tekst.trim() || uitgeschakeld}>
              Zet op het bord
            </SecundaireKnop>
          </form>
          <form
            className="flex flex-col gap-2 rounded-[16px] border border-rand-zacht bg-wit p-4"
            onSubmit={(e) => {
              e.preventDefault();
              voegBreukToe();
            }}
          >
            <span className="font-bold">Breuk</span>
            <div className="flex items-center gap-2">
              <label className="sr-only" htmlFor="bord-teller">Teller</label>
              <input id="bord-teller" inputMode="numeric" value={teller} onChange={(e) => setTeller(e.target.value)} maxLength={6} placeholder="teller" className="min-h-12 w-24 rounded-[12px] border border-rand-interactief px-3 text-center" />
              <span aria-hidden className="text-xl font-bold">/</span>
              <label className="sr-only" htmlFor="bord-noemer">Noemer</label>
              <input id="bord-noemer" inputMode="numeric" value={noemer} onChange={(e) => setNoemer(e.target.value)} maxLength={6} placeholder="noemer" className="min-h-12 w-24 rounded-[12px] border border-rand-interactief px-3 text-center" />
            </div>
            <SecundaireKnop type="submit" disabled={!teller.trim() || !noemer.trim() || uitgeschakeld}>
              Zet op het bord
            </SecundaireKnop>
          </form>

          {gekozen && (
            <div className="flex flex-col gap-2 rounded-[16px] border-2 border-geel bg-wit p-4">
              <p className="font-bold">{omschrijf(gekozen)}</p>
              {(gekozen.soort === "rechthoek" || gekozen.soort === "cirkel") && (
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex flex-col gap-1 tekst-klein font-semibold">
                    Delen
                    <input type="number" min={1} max={24} value={gekozen.delen} onChange={(e) => plaats({ ...gekozen, delen: Math.max(1, Math.min(24, Number(e.target.value) || 1)), gevuld: Math.min(gekozen.gevuld, Math.max(1, Math.min(24, Number(e.target.value) || 1))) })} className="min-h-12 rounded-[12px] border border-rand-interactief px-3" />
                  </label>
                  <label className="flex flex-col gap-1 tekst-klein font-semibold">
                    Gekleurd
                    <input type="number" min={0} max={gekozen.delen} value={gekozen.gevuld} onChange={(e) => plaats({ ...gekozen, gevuld: Math.max(0, Math.min(gekozen.delen, Number(e.target.value) || 0)) })} className="min-h-12 rounded-[12px] border border-rand-interactief px-3" />
                  </label>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => plaats({ ...gekozen, kleur })} className={knopKlasse(false)}>
                  Gekozen kleur
                </button>
                <button type="button" onClick={() => verwijder(gekozen.id)} className={knopKlasse(false)}>
                  Verwijder
                </button>
              </div>
            </div>
          )}

          {elementen.length > 0 && (
            <details className="rounded-[16px] border border-rand-zacht bg-wit p-4">
              <summary className="min-h-12 cursor-pointer content-center font-bold">Op het bord ({elementen.length})</summary>
              <ul className="mt-2 flex flex-col gap-1">
                {elementen.map((e) => (
                  <li key={e.id}>
                    <button type="button" onClick={() => setGeselecteerd(e.id)} aria-pressed={geselecteerd === e.id} className="min-h-12 w-full rounded-[10px] px-2 text-left hover:bg-blauw-zacht aria-pressed:bg-blauw-zacht">
                      {omschrijf(e)}
                    </button>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      </div>
      {vol && <Melding soort="fout">Het bord is vol. Wis eerst iets.</Melding>}
    </div>
  );
}
