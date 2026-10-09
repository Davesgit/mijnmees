"use client";

import { useEffect, useRef, useState } from "react";
import type { Room } from "livekit-client";
import { Melding } from "@/components/mees/Bouwstenen";
import { Icoon } from "@/components/mees/Icoon";
import { PrimaireKnop, SecundaireKnop } from "@/components/mees/Knoppen";
import { decodeer } from "@/features/live/bordkanaal";
import { BordWeergave } from "@/features/tutorhulp/BordWeergave";
import { pasGebeurtenisToe, type BordElement, type BordGebeurtenis } from "@/features/tutorhulp/bord";
import { useSchermAan } from "@/components/mees/useSchermAan";
import { stelVraag } from "../../acties";

type Verbinding = "uit" | "verbinden" | "verbonden" | "opnieuw" | "afgelopen" | "fout";
type EigenVraag = { id: string; tekst: string; beantwoord: boolean };

/** L04: luisteren en kijken (geen microfoon of camera), privévragen aan de tutor. */
export function KindLive({ les }: { les: { id: string; titel: string; tutorVoornaam: string; oefenRoute: string } }) {
  const [verbinding, setVerbinding] = useState<Verbinding>("uit");
  const [hoortTutor, setHoortTutor] = useState(false);
  const [elementen, setElementen] = useState<BordElement[]>([]);
  const [vraag, setVraag] = useState("");
  const [vragen, setVragen] = useState<EigenVraag[]>([]);
  const [gepauzeerd, setGepauzeerd] = useState(false);
  const [melding, setMelding] = useState<{ soort: "succes" | "fout"; tekst: string } | null>(null);
  const [bezig, setBezig] = useState(false);
  const room = useRef<Room | null>(null);
  const audioPlek = useRef<HTMLDivElement>(null);
  const bordKader = useRef<HTMLDivElement>(null);
  useSchermAan(verbinding === "verbonden" || verbinding === "opnieuw");

  async function doeMee() {
    setVerbinding("verbinden");
    const a = await fetch("/api/live/token", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lesId: les.id, rol: "kind" }) }).catch(() => null);
    if (!a?.ok) {
      const j = (await a?.json().catch(() => null)) as { reden?: string } | null;
      setVerbinding(j?.reden === "les loopt niet" ? "afgelopen" : "fout");
      return;
    }
    const { token, url } = (await a.json()) as { token: string; url: string };
    const { Room, RoomEvent, Track } = await import("livekit-client");
    const kamer = new Room();
    kamer
      .on(RoomEvent.TrackSubscribed, (track) => {
        if (track.kind !== Track.Kind.Audio) return;
        const el = track.attach();
        audioPlek.current?.appendChild(el);
        setHoortTutor(true);
      })
      .on(RoomEvent.TrackUnsubscribed, (track) => {
        track.detach().forEach((el) => el.remove());
        setHoortTutor(false);
      })
      .on(RoomEvent.DataReceived, (data) => {
        const b = decodeer(data);
        if (!b) return;
        if (b.soort === "einde") {
          setVerbinding("afgelopen");
          kamer.disconnect();
          return;
        }
        setElementen((huidig) => pasGebeurtenisToe(huidig, { ...b.g, t: 0 } as BordGebeurtenis));
      })
      .on(RoomEvent.Reconnecting, () => setVerbinding("opnieuw"))
      .on(RoomEvent.Reconnected, () => setVerbinding("verbonden"))
      .on(RoomEvent.Disconnected, () => setVerbinding((v) => (v === "afgelopen" ? v : "uit")));
    try {
      await kamer.connect(url, token, { autoSubscribe: true });
      // Afspelen mag pas na een tik van het kind (deze knop): daarom hier starten.
      await kamer.startAudio();
      room.current = kamer;
      setVerbinding("verbonden");
    } catch {
      setVerbinding("fout");
    }
  }

  function verlaat() {
    room.current?.disconnect();
    room.current = null;
    setVerbinding("uit");
    setHoortTutor(false);
  }

  useEffect(
    () => () => {
      room.current?.disconnect();
    },
    [],
  );

  // Eigen vragen en of vragen even gepauzeerd zijn.
  useEffect(() => {
    if (verbinding !== "verbonden" && verbinding !== "opnieuw") return;
    let actief = true;
    const haal = async () => {
      const a = await fetch(`/api/live/vragen?lesId=${les.id}`, { cache: "no-store" }).catch(() => null);
      if (!a?.ok || !actief) return;
      const j = (await a.json()) as { vragen: EigenVraag[]; gepauzeerd: boolean; lesStatus: string };
      setVragen(j.vragen);
      setGepauzeerd(j.gepauzeerd);
      if (j.lesStatus === "afgelopen") {
        setVerbinding("afgelopen");
        room.current?.disconnect();
      }
    };
    void haal();
    const iv = setInterval(haal, 5000);
    return () => {
      actief = false;
      clearInterval(iv);
    };
  }, [verbinding, les.id]);

  async function verstuur(e: React.FormEvent) {
    e.preventDefault();
    if (!vraag.trim()) return;
    setBezig(true);
    const r = await stelVraag(les.id, vraag).catch(() => ({ ok: false, melding: "Dit lukt nu niet." }));
    setBezig(false);
    setMelding({ soort: r.ok ? "succes" : "fout", tekst: r.melding ?? "" });
    if (r.ok) {
      setVraag("");
      setVragen((v) => [...v, { id: crypto.randomUUID(), tekst: vraag.trim(), beantwoord: false }]);
    }
  }

  function volledigScherm() {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else bordKader.current?.requestFullscreen?.().catch(() => {});
  }

  if (verbinding === "afgelopen") {
    return (
      <div className="flex flex-col gap-4">
        <Melding soort="succes">De les is afgelopen. Fijn dat je meedeed!</Melding>
        <div className="flex flex-col gap-3 tablet:flex-row">
          <PrimaireKnop href={les.oefenRoute} groot>
            Probeer het zelf
            <Icoon naam="pijl-rechts" />
          </PrimaireKnop>
          <SecundaireKnop href="/kind/start" groot>
            Naar start
          </SecundaireKnop>
        </div>
      </div>
    );
  }

  if (verbinding === "uit" || verbinding === "verbinden" || verbinding === "fout") {
    return (
      <div className="flex flex-col items-start gap-4">
        <p className="text-lg">Je ziet en hoort {les.tutorVoornaam}. Jouw microfoon en camera blijven uit. Andere kinderen zien jou niet.</p>
        {verbinding === "fout" && <Melding soort="fout">Meedoen lukt nu niet. Probeer het nog eens.</Melding>}
        <PrimaireKnop onClick={doeMee} groot disabled={verbinding === "verbinden"}>
          <Icoon naam="voorlezen" />
          {verbinding === "verbinden" ? "Even wachten…" : "Start geluid en doe mee"}
        </PrimaireKnop>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-blauw-zacht px-4 py-2 font-bold" aria-live="polite">
          <Icoon naam="voorlezen" className="size-5 text-actie-blauw" />
          {verbinding === "opnieuw" ? "Opnieuw verbinden…" : hoortTutor ? `Je hoort ${les.tutorVoornaam}` : `${les.tutorVoornaam} begint zo`}
        </span>
        <SecundaireKnop onClick={volledigScherm}>
          <Icoon naam="kader" />
          Volledig scherm
        </SecundaireKnop>
        <SecundaireKnop onClick={verlaat} className="ml-auto">
          Verlaat les
        </SecundaireKnop>
      </div>
      <div ref={audioPlek} className="hidden" />

      <div className="grid gap-5 desktop:grid-cols-[1fr_20rem]">
        <div ref={bordKader} className="flex flex-col justify-center bg-wit [&:fullscreen]:p-4">
          <BordWeergave elementen={elementen} label={`Tekenbord van ${les.tutorVoornaam}`} />
        </div>

        <section aria-labelledby="vraag-kop" className="flex flex-col gap-3 self-start rounded-[16px] border border-rand-zacht bg-wit p-4">
          <h2 id="vraag-kop" className="subtitel">
            Stel je vraag
          </h2>
          <p className="tekst-klein text-tekst-zacht">Je vraag is alleen zichtbaar voor de tutor. Schrijf geen namen of adressen.</p>
          {gepauzeerd ? (
            <Melding>De tutor beantwoordt even geen vragen. Je kunt wel blijven kijken.</Melding>
          ) : (
            <form onSubmit={verstuur} className="flex flex-col gap-2">
              <label htmlFor="les-vraag" className="sr-only">
                Je vraag
              </label>
              <textarea id="les-vraag" value={vraag} onChange={(e) => setVraag(e.target.value.slice(0, 200))} rows={3} className="rounded-[12px] border border-rand-interactief px-3 py-2 text-lg" />
              <PrimaireKnop type="submit" disabled={bezig || !vraag.trim()}>
                {bezig ? "Even wachten…" : "Stuur vraag"}
              </PrimaireKnop>
            </form>
          )}
          {melding && <Melding soort={melding.soort === "fout" ? "fout" : "succes"}>{melding.tekst}</Melding>}
          {vragen.length > 0 && (
            <ul className="flex flex-col gap-2">
              {vragen.map((v) => (
                <li key={v.id} className="rounded-[12px] bg-achtergrond-zacht p-3">
                  <p>{v.tekst}</p>
                  <p className="mt-1 tekst-klein font-semibold text-tekst-zacht">{v.beantwoord ? "De tutor heeft je vraag beantwoord." : "Verstuurd"}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
