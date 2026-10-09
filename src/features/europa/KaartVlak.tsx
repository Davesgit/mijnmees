"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Icoon } from "@/components/mees/Icoon";
import { isKleinLand, kaart, kaderVoorLanden } from "./kaart";

export type KaartLaag = "landen" | "hoofdsteden" | "wateren" | "rivieren" | "gebergten";
type View = [number, number, number, number];

const kleuren = {
  zee: "#cfe6fb",
  context: "#e3e7ec",
  neutraal: "#d6dde6",
  donker: "#9aa7b8",
  rand: "#ffffff",
  gekozen: "#0789f8",
  goed: "#16a34a",
  doel: "#f59e0b",
  rivier: "#3b82f6",
  gebergte: "#a16207",
};

/**
 * KaartVlak: echte kaartvormen, handmatig zoomen en verschuiven, aantikken van één laag.
 * Geen automatisch inzoomen op het goede antwoord; de doelrand/hover is neutraal.
 */
export function KaartVlak({
  selectie,
  stijl,
  laag,
  gekozen,
  onKies,
  markering,
  donker = [],
  geplaatst = [],
  goed,
  toonDoel,
  label,
  className = "",
}: {
  selectie: string[];
  /** Gekleurd: landen in de selectie in pastelkleuren. Neutraal: alles grijs (meerkeuze en puzzel). */
  stijl: "gekleurd" | "neutraal";
  /** Welke laag aangetikt kan worden; null = alleen kijken. */
  laag: KaartLaag | KaartLaag[] | null;
  gekozen?: string | null;
  onKies?: (id: string) => void;
  markering?: string | null;
  donker?: string[];
  geplaatst?: string[];
  goed?: string | null;
  toonDoel?: string | null;
  label: string;
  className?: string;
}) {
  const lagen = useMemo(() => (laag === null ? [] : Array.isArray(laag) ? laag : [laag]), [laag]);
  const thuis = useMemo<View>(() => kaderVoorLanden(selectie) as View, [selectie]);
  const [view, setView] = useState<View>(thuis);
  const [thuisVoor, setThuisVoor] = useState(thuis);
  if (thuisVoor !== thuis) {
    setThuisVoor(thuis);
    setView(thuis);
  }

  const svgRef = useRef<SVGSVGElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const sleep = useRef<{ startX: number; startY: number; view: View; afstand?: number; anker?: [number, number]; bewogen: boolean } | null>(null);

  const inSelectie = useMemo(() => new Set(selectie), [selectie]);
  const geplaatstSet = useMemo(() => new Set(geplaatst), [geplaatst]);
  const donkerSet = useMemo(() => new Set(donker), [donker]);

  function schaal() {
    const r = svgRef.current?.getBoundingClientRect();
    if (!r) return 1;
    return Math.max(view[2] / r.width, view[3] / r.height);
  }

  function zoom(factor: number, rond?: [number, number]) {
    setView(([x, y, w, h]) => {
      const nw = Math.min(kaart.viewBox[2] * 1.2, Math.max(40, w / factor));
      const nh = (nw / w) * h;
      const [cx, cy] = rond ?? [x + w / 2, y + h / 2];
      return [cx - ((cx - x) * nw) / w, cy - ((cy - y) * nh) / h, nw, nh];
    });
  }

  /** Schermpunt → kaartcoördinaat voor een gegeven beeld (rekening houdend met 'meet'-schaling). */
  function naarKaart(cx: number, cy: number, v: View = view): [number, number] {
    const r = svgRef.current!.getBoundingClientRect();
    const sc = Math.max(v[2] / r.width, v[3] / r.height);
    const ox = v[0] + (v[2] - r.width * sc) / 2;
    const oy = v[1] + (v[3] - r.height * sc) / 2;
    return [ox + (cx - r.left) * sc, oy + (cy - r.top) * sc];
  }

  /** Begin (opnieuw) te volgen vanaf de vingers die nu op de kaart staan. */
  function startSleep(v: View, bewogen: boolean) {
    const p = [...pointers.current.values()];
    if (p.length === 0) {
      sleep.current = null;
      return;
    }
    const twee = p.length >= 2;
    const midden = twee ? { x: (p[0].x + p[1].x) / 2, y: (p[0].y + p[1].y) / 2 } : p[0];
    sleep.current = {
      startX: midden.x,
      startY: midden.y,
      view: v,
      afstand: twee ? Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) : undefined,
      anker: twee ? naarKaart(midden.x, midden.y, v) : undefined,
      bewogen,
    };
  }

  function onPointerDown(e: ReactPointerEvent<SVGSVGElement>) {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    startSleep(view, pointers.current.size > 1);
  }

  function onPointerMove(e: ReactPointerEvent<SVGSVGElement>) {
    if (!pointers.current.has(e.pointerId) || !sleep.current) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const p = [...pointers.current.values()];
    const s = schaal();
    if (p.length >= 2 && sleep.current.afstand && sleep.current.anker) {
      // Knijpen: zoomen rond het punt tussen de vingers, en meeschuiven met dat punt.
      const r = svgRef.current!.getBoundingClientRect();
      const midden = { x: (p[0].x + p[1].x) / 2, y: (p[0].y + p[1].y) / 2 };
      const factor = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) / sleep.current.afstand;
      const [, , w, h] = sleep.current.view;
      const nw = Math.min(kaart.viewBox[2] * 1.2, Math.max(40, w / factor));
      const nh = (nw / w) * h;
      const sc = Math.max(nw / r.width, nh / r.height);
      const [ax, ay] = sleep.current.anker;
      const x = ax - (midden.x - r.left) * sc - (nw - r.width * sc) / 2;
      const y = ay - (midden.y - r.top) * sc - (nh - r.height * sc) / 2;
      setView([x, y, nw, nh]);
      sleep.current.bewogen = true;
      return;
    }
    const dx = e.clientX - sleep.current.startX;
    const dy = e.clientY - sleep.current.startY;
    if (Math.hypot(dx, dy) > 6) sleep.current.bewogen = true;
    if (sleep.current.bewogen) {
      const [x, y, w, h] = sleep.current.view;
      setView([x - dx * s, y - dy * s, w, h]);
    }
  }

  function onPointerUp(e: ReactPointerEvent<SVGSVGElement>) {
    const was = sleep.current;
    pointers.current.delete(e.pointerId);
    if (pointers.current.size > 0) {
      // Eén vinger los na knijpen: verder schuiven vanaf hier, zonder sprong en zonder aantikken.
      startSleep(view, true);
      return;
    }
    sleep.current = null;
    if (was && !was.bewogen && onKies) {
      const doel = (document.elementFromPoint(e.clientX, e.clientY) as Element | null)?.closest("[data-id]");
      const id = doel?.getAttribute("data-id");
      if (id) onKies(id);
    }
  }

  // Muiswiel/trackpad (computer): zoomen rond de muisaanwijzer.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const wiel = (e: WheelEvent) => {
      e.preventDefault();
      const r = svg.getBoundingClientRect();
      const v = svg.viewBox.baseVal;
      const sc = Math.max(v.width / r.width, v.height / r.height);
      const punt: [number, number] = [v.x + (v.width - r.width * sc) / 2 + (e.clientX - r.left) * sc, v.y + (v.height - r.height * sc) / 2 + (e.clientY - r.top) * sc];
      zoom(Math.exp(-e.deltaY * 0.0015), punt);
    };
    svg.addEventListener("wheel", wiel, { passive: false });
    return () => svg.removeEventListener("wheel", wiel);
  }, []);

  const klikbaarLand = lagen.includes("landen");
  const kleurLand = (id: string, eigenKleur: string) => {
    if (goed === id) return kleuren.goed;
    if (toonDoel === id) return kleuren.doel;
    if (markering === id || gekozen === id) return kleuren.gekozen;
    if (geplaatstSet.has(id)) return eigenKleur;
    if (donkerSet.has(id)) return kleuren.donker;
    if (inSelectie.has(id)) return stijl === "gekleurd" ? eigenKleur : kleuren.neutraal;
    return kleuren.context;
  };

  // Genummerde plekken voor toetsenbord en schermlezer, van west naar oost; zonder namen.
  const plekken = useMemo(() => {
    const lijst: { id: string; x: number }[] = [];
    if (lagen.includes("landen")) for (const l of kaart.landen) if (inSelectie.has(l.id)) lijst.push({ id: l.id, x: l.midden[0] });
    if (lagen.includes("hoofdsteden")) for (const h of kaart.hoofdsteden) if (inSelectie.has(h.land)) lijst.push({ id: h.id, x: h.x });
    if (lagen.includes("wateren")) for (const w of kaart.wateren) lijst.push({ id: w.id, x: w.midden?.[0] ?? 0 });
    if (lagen.includes("rivieren")) for (const r of kaart.rivieren) lijst.push({ id: r.id, x: r.bbox?.[0] ?? 0 });
    if (lagen.includes("gebergten")) for (const g of kaart.gebergten) lijst.push({ id: g.id, x: g.midden?.[0] ?? 0 });
    return lijst.sort((a, b) => a.x - b.x);
  }, [lagen, inSelectie]);

  const toonRivieren = lagen.includes("rivieren") || kaart.rivieren.some((r) => [markering, toonDoel, goed, gekozen].includes(r.id));
  const toonGebergten = lagen.includes("gebergten") || kaart.gebergten.some((g) => [markering, toonDoel, goed, gekozen].includes(g.id));

  const objectVulling = (id: string, basis: string, basisOpacity: number) => {
    if (goed === id) return { fill: kleuren.goed, opacity: 0.75 };
    if (toonDoel === id) return { fill: kleuren.doel, opacity: 0.75 };
    if (markering === id || gekozen === id) return { fill: kleuren.gekozen, opacity: 0.6 };
    return { fill: basis, opacity: basisOpacity };
  };

  return (
    <div className={`relative overflow-hidden rounded-[20px] border border-rand-zacht bg-[#cfe6fb] ${className}`}>
      <svg
        ref={svgRef}
        viewBox={view.join(" ")}
        role="img"
        aria-label={label}
        className="block h-full w-full touch-none select-none"
        style={{ cursor: onKies ? "pointer" : "grab" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={(e) => {
          pointers.current.delete(e.pointerId);
          sleep.current = null;
        }}
      >
        <rect x={-500} y={-500} width={2200} height={1800} fill={kleuren.zee} />
        <g fill={kleuren.context} stroke={kleuren.rand} strokeWidth={0.8} vectorEffect="non-scaling-stroke">
          {kaart.context.map((d, i) => (
            <path key={i} d={d} vectorEffect="non-scaling-stroke" />
          ))}
        </g>
        {/* Wateren als aantikbare vlakken (onzichtbaar tot ze gekozen of gemarkeerd zijn). */}
        <g>
          {kaart.wateren.map((w) => {
            const v = objectVulling(w.id, kleuren.zee, 0);
            const actief = lagen.includes("wateren");
            return (
              <path
                key={w.id}
                d={w.pad}
                data-id={actief ? w.id : undefined}
                fill={v.fill}
                fillOpacity={v.opacity}
                style={{ pointerEvents: actief ? "auto" : "none" }}
              />
            );
          })}
        </g>
        <g stroke={kleuren.rand} strokeWidth={1} strokeLinejoin="round">
          {kaart.landen.map((l) => (
            <path
              key={l.id}
              d={l.pad}
              data-id={klikbaarLand && inSelectie.has(l.id) ? l.id : undefined}
              fill={kleurLand(l.id, l.kleur)}
              vectorEffect="non-scaling-stroke"
              className={klikbaarLand && inSelectie.has(l.id) ? "transition-[filter] hover:brightness-95" : undefined}
              style={{ pointerEvents: klikbaarLand && inSelectie.has(l.id) ? "auto" : "none" }}
            />
          ))}
        </g>
        <g fill={kleuren.zee}>
          {kaart.meren.map((d, i) => (
            <path key={i} d={d} style={{ pointerEvents: "none" }} />
          ))}
        </g>
        {toonGebergten && (
          <g>
            {kaart.gebergten.map((g) => {
              const v = objectVulling(g.id, kleuren.gebergte, 0.28);
              const actief = lagen.includes("gebergten");
              return (
                <path
                  key={g.id}
                  d={g.pad}
                  data-id={actief ? g.id : undefined}
                  fill={v.fill}
                  fillOpacity={v.opacity}
                  stroke={v.fill}
                  strokeOpacity={0.6}
                  strokeWidth={1}
                  vectorEffect="non-scaling-stroke"
                  style={{ pointerEvents: actief ? "auto" : "none" }}
                />
              );
            })}
          </g>
        )}
        {toonRivieren && (
          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            {kaart.rivieren.map((r) => {
              const v = objectVulling(r.id, kleuren.rivier, 1);
              const actief = lagen.includes("rivieren");
              return (
                <g key={r.id}>
                  <path d={r.pad} stroke={v.fill} strokeWidth={v.fill === kleuren.rivier ? 2.5 : 4} vectorEffect="non-scaling-stroke" style={{ pointerEvents: "none" }} />
                  {actief && <path d={r.pad} data-id={r.id} stroke="transparent" strokeWidth={18} vectorEffect="non-scaling-stroke" style={{ pointerEvents: "stroke" }} />}
                </g>
              );
            })}
          </g>
        )}
        {/* Microstaten: neutrale stip met groter aantikvlak; verraadt het antwoord niet. */}
        {klikbaarLand && (
          <g>
            {kaart.landen
              .filter((l) => inSelectie.has(l.id) && isKleinLand(l))
              .map((l) => (
                <g key={l.id} data-id={l.id} style={{ pointerEvents: "auto" }}>
                  <circle cx={l.midden[0]} cy={l.midden[1]} r={view[2] / 70} fill="transparent" />
                  <circle
                    cx={l.midden[0]}
                    cy={l.midden[1]}
                    r={view[2] / 220}
                    fill={kleurLand(l.id, "#ffffff") === kleuren.context ? "#ffffff" : kleurLand(l.id, "#ffffff")}
                    stroke="#111d55"
                    strokeWidth={1.2}
                    vectorEffect="non-scaling-stroke"
                  />
                </g>
              ))}
          </g>
        )}
        {(lagen.includes("hoofdsteden") || kaart.hoofdsteden.some((h) => [markering, toonDoel, goed, gekozen].includes(h.id))) && (
          <g>
            {kaart.hoofdsteden
              .filter((h) => inSelectie.has(h.land))
              .map((h) => {
                const kleur = goed === h.id ? kleuren.goed : toonDoel === h.id ? kleuren.doel : gekozen === h.id || markering === h.id ? kleuren.gekozen : "#ffffff";
                const groot = kleur !== "#ffffff";
                return (
                  <g key={h.id} data-id={lagen.includes("hoofdsteden") ? h.id : undefined} style={{ pointerEvents: lagen.includes("hoofdsteden") ? "auto" : "none" }}>
                    <circle cx={h.x} cy={h.y} r={view[2] / 60} fill="transparent" />
                    <circle cx={h.x} cy={h.y} r={(view[2] / 200) * (groot ? 1.6 : 1)} fill={kleur} stroke="#111d55" strokeWidth={1.4} vectorEffect="non-scaling-stroke" />
                  </g>
                );
              })}
          </g>
        )}
      </svg>

      {/* Windroos: noord boven, oost rechts, zuid onder, west links. */}
      <svg viewBox="-34 -34 68 68" className="pointer-events-none absolute left-2 top-2 size-16 tablet:size-[72px]" aria-hidden>
        <circle r="31" fill="#ffffff" fillOpacity="0.85" stroke="#c8ddf0" />
        <path d="M0 -21 5 -5 21 0 5 5 0 21 -5 5 -21 0 -5 -5Z" fill="#c8ddf0" />
        <path d="M0 -21 5 -5 0 0 -5 -5Z" fill="#111d55" />
        <path d="M0 21 5 5 0 0 -5 5Z" fill="#66809e" />
        <circle r="2.2" fill="#ffffff" stroke="#111d55" strokeWidth="1" />
        <g fill="#111d55" fontSize="10" fontWeight="800" textAnchor="middle" dominantBaseline="central" fontFamily="inherit">
          <text y="-26.5">N</text>
          <text x="26" fill="#4a5878">O</text>
          <text y="26.5" fill="#4a5878">Z</text>
          <text x="-26" fill="#4a5878">W</text>
        </g>
      </svg>

      {/* Zoomknoppen rechtsboven, zodat de onderkant vrij is voor de vraag. */}
      <div className="absolute right-3 top-3 flex flex-col items-end gap-2">
        <button type="button" onClick={() => zoom(1.5)} className="grid size-12 place-items-center rounded-[12px] border border-rand-zacht bg-wit text-inkt shadow-sm hover:bg-blauw-zacht" aria-label="Inzoomen">
          <Icoon naam="plus" />
        </button>
        <button type="button" onClick={() => zoom(1 / 1.5)} className="grid size-12 place-items-center rounded-[12px] border border-rand-zacht bg-wit text-inkt shadow-sm hover:bg-blauw-zacht" aria-label="Uitzoomen">
          <Icoon naam="min" />
        </button>
        <button
          type="button"
          onClick={() => setView(thuis)}
          aria-label="Heel gebied"
          className="grid size-12 place-items-center rounded-[12px] border border-rand-zacht bg-wit text-base font-semibold text-inkt shadow-sm hover:bg-blauw-zacht tablet:flex tablet:w-auto tablet:gap-2 tablet:px-3"
        >
          <Icoon naam="kader" />
          <span className="hidden tablet:inline">Heel gebied</span>
        </button>
      </div>

      {onKies && plekken.length > 0 && (
        <details className="absolute left-3 top-[5.25rem] max-h-[60%] w-auto max-w-[14rem] overflow-auto rounded-[12px] border border-rand-zacht bg-wit/95 text-base shadow-sm open:w-56 open:p-2">
          <summary className="flex min-h-11 min-w-11 cursor-pointer list-none items-center justify-center gap-2 rounded-[10px] px-2 font-semibold tablet:px-3 [&::-webkit-details-marker]:hidden">
            <Icoon naam="lijst" className="size-5" />
            <span className="sr-only tablet:not-sr-only">Plekken als lijst</span>
          </summary>
          <ul className="mt-1 flex flex-col gap-1">
            {plekken.map((p, i) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => onKies(p.id)}
                  aria-pressed={gekozen === p.id}
                  className={`min-h-11 w-full rounded-[10px] px-3 text-left ${gekozen === p.id ? "bg-blauw-zacht font-bold" : "hover:bg-achtergrond-zacht"}`}
                >
                  Plek {i + 1}
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
