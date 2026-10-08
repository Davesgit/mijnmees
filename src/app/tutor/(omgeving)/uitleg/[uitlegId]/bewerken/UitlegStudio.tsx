"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { Melding } from "@/components/mees/Bouwstenen";
import { Icoon } from "@/components/mees/Icoon";
import { PrimaireKnop, SecundaireKnop, TekstKnop } from "@/components/mees/Knoppen";
import { BordWeergave } from "@/features/tutorhulp/BordWeergave";
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
  type BordOpname,
} from "@/features/tutorhulp/bord";
import { createClient } from "@/lib/supabase/client";
import { bewaarUitleg, vraagUploadLink } from "@/app/tutor/acties";

type Gereedschap = "kies" | "pen" | "pijl" | "rechthoek" | "cirkel";
type OpnameStatus = "uit" | "klaar-om-te-starten" | "neemt-op" | "opgenomen" | "bewaren";
const MAX_OPNAME_MS = 10 * 60 * 1000;

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

function kiesMime() {
  if (typeof MediaRecorder === "undefined") return null;
  return ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/mp4", "audio/webm", "audio/aac"].find((m) => MediaRecorder.isTypeSupported(m)) ?? "";
}

const tijd = (ms: number) => `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, "0")}`;

/** U04: tekenbord met getypte tekst, breuken en breukmodellen; stem + bordgebeurtenissen samen opnemen. */
export function UitlegStudio({ uitleg }: { uitleg: { id: string; titel: string; bord: BordOpname; heeftOpname: boolean; duurMs: number | null } }) {
  const router = useRouter();
  const svgRef = useRef<SVGSVGElement>(null);
  const [titel, setTitel] = useState(uitleg.titel);
  const [elementen, setElementen] = useState<BordElement[]>(uitleg.bord.elementen ?? []);
  const [terug, setTerug] = useState<BordElement[][]>([]);
  const [vooruit, setVooruit] = useState<BordElement[][]>([]);
  const [gereedschap, setGereedschap] = useState<Gereedschap>("kies");
  const [kleur, setKleur] = useState<BordKleur>("inkt");
  const [geselecteerd, setGeselecteerd] = useState<string | null>(null);
  const [concept, setConcept] = useState<BordElement | null>(null);
  const sleep = useRef<{ start: [number, number]; origineel?: BordElement; verplaatst?: BordElement } | null>(null);

  const [tekst, setTekst] = useState("");
  const [groot, setGroot] = useState(false);
  const [teller, setTeller] = useState("");
  const [noemer, setNoemer] = useState("");

  // Opname
  const [status, setStatus] = useState<OpnameStatus>("uit");
  const [melding, setMelding] = useState<{ soort: "fout" | "info" | "succes"; tekst: string } | null>(null);
  const [niveau, setNiveau] = useState(0);
  const [verstreken, setVerstreken] = useState(0);
  const [opname, setOpname] = useState<{ blob: Blob; url: string; duurMs: number; bord: BordOpname } | null>(null);
  const stroom = useRef<MediaStream | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const stukjes = useRef<Blob[]>([]);
  const t0 = useRef(0);
  const begin = useRef<BordElement[]>([]);
  const gebeurtenissen = useRef<BordGebeurtenis[]>([]);
  const meter = useRef<{ ctx: AudioContext; frame: number } | null>(null);

  const neemtOp = status === "neemt-op";
  const kanBord = status !== "bewaren";

  function wijzig(volgende: BordElement[], g: Omit<BordGebeurtenis, "t"> | BordGebeurtenis) {
    if (volgende.length > bordLimieten.elementen) {
      setMelding({ soort: "fout", tekst: "Het bord is vol. Wis eerst iets." });
      return;
    }
    setTerug((s) => [...s.slice(-50), elementen]);
    setVooruit([]);
    setElementen(volgende);
    if (neemtOp && gebeurtenissen.current.length < bordLimieten.gebeurtenissen) {
      gebeurtenissen.current.push({ ...g, t: Math.round(performance.now() - t0.current) } as BordGebeurtenis);
    }
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
    if (neemtOp) gebeurtenissen.current.push({ t: Math.round(performance.now() - t0.current), op: "zet", elementen: vorige });
  }
  function opnieuw() {
    const volgende = vooruit.at(-1);
    if (!volgende) return;
    setVooruit((s) => s.slice(0, -1));
    setTerug((s) => [...s, elementen]);
    setElementen(volgende);
    if (neemtOp) gebeurtenissen.current.push({ t: Math.round(performance.now() - t0.current), op: "zet", elementen: volgende });
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
    if (!kanBord) return;
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
        if (neemtOp) gebeurtenissen.current.push({ t: Math.round(performance.now() - t0.current), op: "plaats", element: s.verplaatst });
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

  /* ---------- Microfoon en opname ---------- */

  function stopMeter() {
    if (meter.current) {
      cancelAnimationFrame(meter.current.frame);
      meter.current.ctx.close().catch(() => {});
      meter.current = null;
    }
  }

  async function microfoonTest() {
    setMelding(null);
    if (kiesMime() === null || !navigator.mediaDevices?.getUserMedia) {
      setMelding({ soort: "fout", tekst: "Deze browser kan geen geluid opnemen. Gebruik een recente Chrome, Edge, Firefox of Safari." });
      return;
    }
    try {
      stroom.current?.getTracks().forEach((t) => t.stop());
      stroom.current = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch (fout) {
      const naam = (fout as DOMException).name;
      setMelding({
        soort: "fout",
        tekst: naam === "NotAllowedError" ? "Mees mag de microfoon niet gebruiken. Sta de microfoon toe in je browser en probeer opnieuw." : "Er is geen microfoon gevonden. Sluit een microfoon aan en probeer opnieuw.",
      });
      return;
    }
    stopMeter();
    const ctx = new AudioContext();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    ctx.createMediaStreamSource(stroom.current).connect(analyser);
    const data = new Uint8Array(analyser.fftSize);
    const lees = () => {
      analyser.getByteTimeDomainData(data);
      let piek = 0;
      for (const v of data) piek = Math.max(piek, Math.abs(v - 128));
      setNiveau(Math.min(1, piek / 64));
      meter.current!.frame = requestAnimationFrame(lees);
    };
    meter.current = { ctx, frame: requestAnimationFrame(lees) };
    setStatus("klaar-om-te-starten");
  }

  function startOpname() {
    if (!stroom.current) return;
    const mime = kiesMime() ?? "";
    const rec = new MediaRecorder(stroom.current, { ...(mime ? { mimeType: mime } : {}), audioBitsPerSecond: 32000 });
    stukjes.current = [];
    rec.ondataavailable = (e) => e.data.size && stukjes.current.push(e.data);
    rec.onstop = () => {
      const duurMs = Math.round(performance.now() - t0.current);
      const blob = new Blob(stukjes.current, { type: rec.mimeType || mime || "audio/webm" });
      setOpname((oud) => {
        if (oud) URL.revokeObjectURL(oud.url);
        return { blob, url: URL.createObjectURL(blob), duurMs, bord: { elementen: begin.current, gebeurtenissen: gebeurtenissen.current } };
      });
      setStatus("opgenomen");
    };
    begin.current = elementen;
    gebeurtenissen.current = [];
    t0.current = performance.now();
    rec.start(1000);
    recorder.current = rec;
    setVerstreken(0);
    setStatus("neemt-op");
  }

  function stopOpname() {
    if (recorder.current?.state === "recording") recorder.current.stop();
  }

  useEffect(() => {
    if (status !== "neemt-op") return;
    const timer = setInterval(() => {
      const ms = performance.now() - t0.current;
      setVerstreken(ms);
      if (ms >= MAX_OPNAME_MS) recorder.current?.stop();
    }, 250);
    return () => clearInterval(timer);
  }, [status]);

  useEffect(
    () => () => {
      stopMeter();
      stroom.current?.getTracks().forEach((t) => t.stop());
    },
    [],
  );

  async function bewaarOpname() {
    if (!opname) return;
    setStatus("bewaren");
    setMelding({ soort: "info", tekst: "De opname wordt bewaard…" });
    const link = await vraagUploadLink(uitleg.id, opname.blob.type).catch(() => null);
    if (!link) {
      setStatus("opgenomen");
      return setMelding({ soort: "fout", tekst: "Bewaren lukt nu niet. Je opname blijft hier staan. Probeer het nog eens." });
    }
    const { error } = await createClient().storage.from("uitleg-audio").uploadToSignedUrl(link.pad, link.token, opname.blob, { contentType: opname.blob.type.split(";")[0] });
    if (error) {
      setStatus("opgenomen");
      return setMelding({ soort: "fout", tekst: "Uploaden lukt nu niet. Je opname blijft hier staan. Probeer het nog eens." });
    }
    const r = await bewaarUitleg({ uitlegId: uitleg.id, titel, bord: opname.bord, audio: { pad: link.pad, mime: opname.blob.type, duurMs: opname.duurMs } }).catch(() => ({ ok: false, melding: undefined }));
    if (!r.ok) {
      setStatus("opgenomen");
      return setMelding({ soort: "fout", tekst: r.melding ?? "Bewaren lukt nu niet. Probeer het nog eens." });
    }
    stopMeter();
    stroom.current?.getTracks().forEach((t) => t.stop());
    router.push(`/tutor/uitleg/${uitleg.id}/controle`);
  }

  async function bewaarConcept() {
    setMelding(null);
    const r = await bewaarUitleg({ uitlegId: uitleg.id, titel, bord: { elementen, gebeurtenissen: [] }, audio: null }).catch(() => ({ ok: false, melding: undefined }));
    setMelding(r.ok ? { soort: "succes", tekst: "Het concept is bewaard. Er is nog niets verstuurd." } : { soort: "fout", tekst: r.melding ?? "Bewaren lukt nu niet." });
  }

  const knopKlasse = (aan: boolean) =>
    `inline-flex min-h-12 items-center justify-center gap-2 rounded-[12px] border px-3 font-semibold ${aan ? "border-2 border-actie-blauw bg-blauw-zacht text-inkt" : "border-rand-interactief bg-wit text-actie-blauw hover:bg-blauw-zacht"} disabled:opacity-50`;

  return (
    <div className="flex flex-col gap-5">
      <label className="flex flex-col gap-2 font-bold tablet:max-w-xl">
        Titel van de uitleg
        <input value={titel} onChange={(e) => setTitel(e.target.value.slice(0, 120))} className="min-h-12 rounded-[12px] border border-rand-interactief bg-wit px-4 font-normal" />
        <span className="tekst-klein font-normal text-tekst-zacht">Zonder naam van het kind.</span>
      </label>

      {/* Gereedschap */}
      <div role="toolbar" aria-label="Tekenbord" className="flex flex-wrap items-center gap-2">
        {gereedschappen.map((g) => (
          <button key={g.id} type="button" aria-pressed={gereedschap === g.id} onClick={() => setGereedschap(g.id)} className={knopKlasse(gereedschap === g.id)} disabled={!kanBord}>
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
        <button type="button" onClick={ongedaan} disabled={!terug.length || !kanBord} className={knopKlasse(false)}>
          Ongedaan maken
        </button>
        <button type="button" onClick={opnieuw} disabled={!vooruit.length || !kanBord} className={knopKlasse(false)}>
          Opnieuw
        </button>
        <button type="button" onClick={() => zet([])} disabled={!elementen.length || !kanBord} className={knopKlasse(false)}>
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
              className={neemtOp ? "border-2 border-fout" : ""}
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
            <SecundaireKnop type="submit" disabled={!tekst.trim() || !kanBord}>
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
            <SecundaireKnop type="submit" disabled={!teller.trim() || !noemer.trim() || !kanBord}>
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

      {/* Opname */}
      <section aria-labelledby="opname-kop" className="flex flex-col gap-3 rounded-[16px] border border-rand-zacht bg-wit p-4 tablet:p-6">
        <h2 id="opname-kop" className="subtitel">
          Stem opnemen
        </h2>
        <p className="text-tekst-zacht">Zet eerst klaar wat je nodig hebt. Tijdens de opname worden je stem en alles wat je op het bord doet samen bewaard (hooguit 10 minuten).</p>
        {uitleg.heeftOpname && !opname && <Melding>Er is al een opname ({tijd(uitleg.duurMs ?? 0)}). Een nieuwe opname vervangt die.</Melding>}

        {status === "uit" && (
          <div>
            <SecundaireKnop onClick={microfoonTest}>
              <Icoon naam="voorlezen" />
              Test microfoon
            </SecundaireKnop>
          </div>
        )}
        {(status === "klaar-om-te-starten" || neemtOp) && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="tekst-klein font-semibold">Geluid</span>
              <span className="h-3 w-48 overflow-hidden rounded-full bg-uitgeschakeld-vlak" role="meter" aria-label="Microfoonniveau" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(niveau * 100)}>
                <span className="block h-full bg-succes transition-[width] duration-75" style={{ width: `${niveau * 100}%` }} />
              </span>
            </div>
            {neemtOp ? (
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 font-bold text-fout" aria-live="polite">
                  <span className="size-3 animate-pulse rounded-full bg-fout" aria-hidden /> Opname loopt · {tijd(verstreken)}
                </span>
                <PrimaireKnop onClick={stopOpname}>
                  <Icoon naam="stop" />
                  Stop opname
                </PrimaireKnop>
              </div>
            ) : (
              <div>
                <PrimaireKnop onClick={startOpname}>Start opname</PrimaireKnop>
              </div>
            )}
          </div>
        )}
        {(status === "opgenomen" || status === "bewaren") && opname && (
          <div className="flex flex-col gap-3">
            <p className="font-semibold">Opname van {tijd(opname.duurMs)}. Luister even terug:</p>
            <audio controls src={opname.url} className="w-full max-w-md" />
            <div className="flex flex-wrap gap-3">
              <PrimaireKnop onClick={bewaarOpname} disabled={status === "bewaren"}>
                {status === "bewaren" ? "Even wachten…" : "Bewaar en controleer"}
              </PrimaireKnop>
              <SecundaireKnop
                disabled={status === "bewaren"}
                onClick={() => {
                  setElementen(opname.bord.elementen);
                  setStatus("klaar-om-te-starten");
                }}
              >
                Opnieuw opnemen
              </SecundaireKnop>
            </div>
          </div>
        )}
        {melding && <Melding soort={melding.soort === "fout" ? "fout" : melding.soort === "succes" ? "succes" : "info"}>{melding.tekst}</Melding>}
      </section>

      <div className="flex flex-wrap gap-3">
        {!uitleg.heeftOpname && status !== "neemt-op" && (
          <SecundaireKnop onClick={bewaarConcept} disabled={status === "bewaren"}>
            Bewaar concept
          </SecundaireKnop>
        )}
        {uitleg.heeftOpname && !opname && (
          <TekstKnop href={`/tutor/uitleg/${uitleg.id}/controle`}>
            Naar controleren
            <Icoon naam="pijl-rechts" />
          </TekstKnop>
        )}
      </div>
    </div>
  );
}
