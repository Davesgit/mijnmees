"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { LocalAudioTrack, Room } from "livekit-client";
import { Melding } from "@/components/mees/Bouwstenen";
import { Icoon } from "@/components/mees/Icoon";
import { GevaarKnop, PrimaireKnop, SecundaireKnop } from "@/components/mees/Knoppen";
import { bordInStukjes, codeer, wijzigingInStukjes } from "@/features/live/bordkanaal";
import { kiesMime, Niveaumeter, useMicrofoon } from "@/features/live/useMicrofoon";
import { bordLimieten, type BordElement, type BordGebeurtenis } from "@/features/tutorhulp/bord";
import { Tekenbord, type ZonderTijd } from "@/features/tutorhulp/Tekenbord";
import { createClient } from "@/lib/supabase/client";
import { bewaarUitleg, vraagUploadLink } from "@/app/tutor/acties";
import { beeindigLes, markeerVraag, pauzeerVragen, startLes } from "@/app/tutor/les-acties";

type Fase = "voorbereiden" | "verbinden" | "live" | "afronden";
type Vraag = { id: string; tekst: string; status: "nieuw" | "apart" | "beantwoord"; reden: string | null; op: string };

const tijd = (ms: number) => `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, "0")}`;

/** L05: live les geven. Tutorstem + bord gaan naar de kinderen; vragen komen privé binnen. */
export function TutorLive({ les }: { les: { id: string; titel: string; opnemen: boolean; status: string; vragenGepauzeerd: boolean } }) {
  const router = useRouter();
  const mic = useMicrofoon();
  const [fase, setFase] = useState<Fase>("voorbereiden");
  const [melding, setMelding] = useState<{ soort: "fout" | "info"; tekst: string } | null>(null);
  const [stil, setStil] = useState(false);
  const [vragen, setVragen] = useState<Vraag[]>([]);
  const [gepauzeerd, setGepauzeerd] = useState(les.vragenGepauzeerd);
  const [tab, setTab] = useState<"nieuw" | "apart" | "beantwoord">("nieuw");
  const [verstreken, setVerstreken] = useState(0);
  const [neemtOp, setNeemtOp] = useState(false);
  const [download, setDownload] = useState<string | null>(null);

  const room = useRef<Room | null>(null);
  const micTrack = useRef<LocalAudioTrack | null>(null);
  const huidig = useRef<BordElement[]>([]);
  const t0 = useRef(0);
  const begin = useRef<BordElement[]>([]);
  const tijdlijn = useRef<BordGebeurtenis[]>([]);
  const recorder = useRef<MediaRecorder | null>(null);
  const stukjes = useRef<Blob[]>([]);
  const opnameId = useRef<string | null>(null);

  async function stuur(berichten: Uint8Array<ArrayBuffer>[]) {
    const r = room.current;
    if (!r) return;
    for (const b of berichten) await r.localParticipant.publishData(b, { reliable: true }).catch(() => {});
  }

  function opBord(g: ZonderTijd, na: BordElement[]) {
    huidig.current = na;
    if (fase !== "live") return;
    void stuur(wijzigingInStukjes(g));
    if (recorder.current && tijdlijn.current.length < bordLimieten.gebeurtenissen) {
      tijdlijn.current.push({ ...g, t: Math.round(performance.now() - t0.current) } as BordGebeurtenis);
    }
  }

  async function start() {
    setMelding(null);
    const stroom = mic.stroom ?? (await mic.start());
    if (!stroom) return;
    setFase("verbinden");
    const r = await startLes(les.id).catch(() => ({ ok: false, melding: undefined, opnameUitlegId: null }));
    if (!r.ok) {
      setFase("voorbereiden");
      return setMelding({ soort: "fout", tekst: r.melding ?? "Starten lukt nu niet." });
    }
    const antwoord = await fetch("/api/live/token", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lesId: les.id, rol: "tutor" }) }).catch(() => null);
    const gegevens = antwoord?.ok ? ((await antwoord.json()) as { token: string; url: string }) : null;
    if (!gegevens) {
      setFase("voorbereiden");
      return setMelding({ soort: "fout", tekst: "Live-geluid is nu niet bereikbaar. Probeer het zo nog eens." });
    }
    const { Room, LocalAudioTrack, Track } = await import("livekit-client");
    const kamer = new Room({ adaptiveStream: false, dynacast: false });
    try {
      await kamer.connect(gegevens.url, gegevens.token);
      const track = new LocalAudioTrack(stroom.getAudioTracks()[0]);
      await kamer.localParticipant.publishTrack(track, { source: Track.Source.Microphone });
      micTrack.current = track;
    } catch {
      kamer.disconnect();
      setFase("voorbereiden");
      return setMelding({ soort: "fout", tekst: "Verbinden lukt niet. Controleer je internet en probeer opnieuw." });
    }
    room.current = kamer;

    // Opname: alleen tutorstem + bordtijdlijn, als dat bij het plannen is gekozen.
    t0.current = performance.now();
    begin.current = huidig.current;
    tijdlijn.current = [];
    opnameId.current = r.opnameUitlegId ?? null;
    if (opnameId.current && kiesMime() !== null) {
      const mime = kiesMime() ?? "";
      const rec = new MediaRecorder(stroom, { ...(mime ? { mimeType: mime } : {}), audioBitsPerSecond: 32000 });
      stukjes.current = [];
      rec.ondataavailable = (e) => e.data.size && stukjes.current.push(e.data);
      rec.start(5000);
      recorder.current = rec;
      setNeemtOp(true);
    }
    setFase("live");
    void stuur(bordInStukjes(huidig.current));
  }

  // Elke paar seconden het hele bord: wie later binnenkomt of even weg was, ziet meteen alles.
  useEffect(() => {
    if (fase !== "live") return;
    const iv = setInterval(() => void stuur(bordInStukjes(huidig.current)), 4000);
    const klok = setInterval(() => setVerstreken(performance.now() - t0.current), 1000);
    return () => {
      clearInterval(iv);
      clearInterval(klok);
    };
  }, [fase]);

  // Vragen ophalen (privé kanaal via de server).
  useEffect(() => {
    if (fase !== "live") return;
    let actief = true;
    const haal = async () => {
      const a = await fetch(`/api/live/vragen?rol=tutor&lesId=${les.id}`, { cache: "no-store" }).catch(() => null);
      if (a?.ok && actief) {
        const j = (await a.json()) as { vragen: Vraag[]; gepauzeerd: boolean };
        setVragen(j.vragen);
      }
    };
    void haal();
    const iv = setInterval(haal, 3000);
    return () => {
      actief = false;
      clearInterval(iv);
    };
  }, [fase, les.id]);

  async function wisselStil() {
    const t = micTrack.current;
    if (!t) return;
    if (stil) await t.unmute();
    else await t.mute();
    setStil(!stil);
  }

  async function wisselPauze() {
    const nieuw = !gepauzeerd;
    if (await pauzeerVragen(les.id, nieuw)) setGepauzeerd(nieuw);
  }

  async function markeer(id: string, status: Vraag["status"]) {
    setVragen((v) => v.map((x) => (x.id === id ? { ...x, status } : x)));
    await markeerVraag(les.id, id, status);
  }

  async function stop() {
    if (!window.confirm("Wil je de les beëindigen? Kinderen kunnen dan niet meer meedoen.")) return;
    setFase("afronden");
    await stuur([codeer({ v: 1, soort: "einde" })]);
    const duurMs = Math.round(performance.now() - t0.current);
    const rec = recorder.current;
    const blob = rec
      ? await new Promise<Blob>((klaar) => {
          rec.onstop = () => klaar(new Blob(stukjes.current, { type: rec.mimeType || "audio/webm" }));
          rec.stop();
        })
      : null;
    room.current?.disconnect();
    mic.stop();
    await beeindigLes(les.id);

    if (blob && opnameId.current && blob.size > 0) {
      setMelding({ soort: "info", tekst: "De opname wordt bewaard…" });
      const link = await vraagUploadLink(opnameId.current, blob.type).catch(() => null);
      const upload = link ? await createClient().storage.from("uitleg-audio").uploadToSignedUrl(link.pad, link.token, blob, { contentType: blob.type.split(";")[0] }) : null;
      if (link && upload && !upload.error) {
        const r = await bewaarUitleg({
          uitlegId: opnameId.current,
          titel: les.titel,
          bord: { elementen: begin.current, gebeurtenissen: tijdlijn.current },
          audio: { pad: link.pad, mime: blob.type, duurMs: Math.max(500, Math.min(duurMs, 3_600_000)) },
        }).catch(() => ({ ok: false }));
        if (r.ok) return router.push(`/tutor/uitleg/${opnameId.current}/controle?les=1`);
      }
      // Bewaren mislukt: laat de opname downloaden, zodat er niets verloren gaat.
      setDownload(URL.createObjectURL(blob));
      setMelding({ soort: "fout", tekst: "De opname kon niet worden bewaard. Download hem hieronder, zodat er niets verloren gaat." });
      return;
    }
    router.push("/tutor/lessen?afgelopen=1");
  }

  useEffect(
    () => () => {
      room.current?.disconnect();
    },
    [],
  );

  const zichtbaar = vragen.filter((v) => v.status === tab);
  const tel = (s: Vraag["status"]) => vragen.filter((v) => v.status === s).length;

  return (
    <div className="flex flex-col gap-5">
      {fase === "voorbereiden" || fase === "verbinden" ? (
        <section className="flex flex-col gap-3 rounded-[16px] border border-rand-zacht bg-wit p-5">
          <h2 className="subtitel">Klaarzetten</h2>
          <p className="text-tekst-zacht">Zet alvast op het bord wat je nodig hebt. Test je microfoon en start dan de les. Kinderen horen alleen jou; ze hebben zelf geen microfoon of camera.</p>
          <div className="flex flex-wrap items-center gap-3">
            {!mic.stroom ? (
              <SecundaireKnop onClick={() => void mic.start()}>
                <Icoon naam="voorlezen" />
                Test microfoon
              </SecundaireKnop>
            ) : (
              <span className="flex items-center gap-2 tekst-klein font-semibold">
                Geluid <Niveaumeter niveau={mic.niveau} />
              </span>
            )}
            <PrimaireKnop onClick={start} disabled={fase === "verbinden"}>
              {fase === "verbinden" ? "Even wachten…" : "Start les"}
            </PrimaireKnop>
          </div>
          {les.opnemen && <p className="tekst-klein text-tekst-zacht">De les wordt opgenomen (alleen jouw stem en het bord). Na afloop controleer je de opname voordat kinderen hem kunnen terugkijken.</p>}
          {mic.fout && <Melding soort="fout">{mic.fout}</Melding>}
        </section>
      ) : (
        <section className="flex flex-wrap items-center gap-3 rounded-[16px] border-2 border-fout bg-wit p-4">
          <span className="inline-flex items-center gap-2 font-bold text-fout" aria-live="polite">
            <span className="size-3 animate-pulse rounded-full bg-fout" aria-hidden /> Live · {tijd(verstreken)}
            {neemtOp && <span className="font-semibold text-tekst-zacht">· wordt opgenomen</span>}
          </span>
          {mic.stroom && <Niveaumeter niveau={stil ? 0 : mic.niveau} />}
          <SecundaireKnop onClick={wisselStil} aria-pressed={stil}>
            {stil ? "Microfoon aan" : "Microfoon uit"}
          </SecundaireKnop>
          <GevaarKnop onClick={stop} disabled={fase === "afronden"} className="ml-auto">
            {fase === "afronden" ? "Even wachten…" : "Beëindig les"}
          </GevaarKnop>
        </section>
      )}
      {melding && <Melding soort={melding.soort === "fout" ? "fout" : "info"}>{melding.tekst}</Melding>}
      {download && (
        <a href={download} download="les-opname" className="self-start font-bold text-actie-blauw underline underline-offset-4">
          Download opname
        </a>
      )}

      <div className="grid gap-5 desktop:grid-cols-[1fr_22rem]">
        <Tekenbord begin={[]} onGebeurtenis={opBord} uitgeschakeld={fase === "afronden"} />

        <section aria-labelledby="vragen-kop" className="flex flex-col gap-3 self-start rounded-[16px] border border-rand-zacht bg-wit p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 id="vragen-kop" className="subtitel">
              Vragen
            </h2>
            <button type="button" onClick={wisselPauze} disabled={fase !== "live"} aria-pressed={gepauzeerd} className="inline-flex min-h-12 items-center rounded-[12px] px-2 font-semibold text-actie-blauw hover:bg-blauw-zacht disabled:opacity-50">
              {gepauzeerd ? "Vragen weer aanzetten" : "Pauzeer vragen"}
            </button>
          </div>
          <p className="tekst-klein text-tekst-zacht">Je ziet geen namen. Beantwoord een vraag hardop voor iedereen, zonder te zeggen van wie hij komt.</p>
          <div role="tablist" aria-label="Soort vragen" className="grid grid-cols-3 gap-1 rounded-[12px] bg-achtergrond-zacht p-1">
            {(
              [
                ["nieuw", "Vragen"],
                ["apart", "Nog beoordelen"],
                ["beantwoord", "Beantwoord"],
              ] as const
            ).map(([s, naam]) => (
              <button key={s} role="tab" aria-selected={tab === s} type="button" onClick={() => setTab(s)} className={`min-h-12 rounded-[10px] px-1 text-sm font-semibold leading-tight ${tab === s ? "bg-wit text-inkt shadow-sm" : "text-tekst-zacht"}`}>
                {naam} ({tel(s)})
              </button>
            ))}
          </div>
          {fase !== "live" && <p className="text-tekst-zacht">Vragen verschijnen hier zodra de les loopt.</p>}
          <ul className="flex max-h-[28rem] flex-col gap-2 overflow-y-auto">
            {zichtbaar.map((v) => (
              <li key={v.id} className="rounded-[12px] border border-rand-zacht p-3">
                <p className="whitespace-pre-line">{v.tekst}</p>
                {v.reden && <p className="mt-1 tekst-klein font-semibold text-probeer-opnieuw">Let op: {v.reden.toLowerCase()}. Niet voorlezen.</p>}
                <div className="mt-2 flex flex-wrap gap-2">
                  {v.status !== "beantwoord" && (
                    <button type="button" onClick={() => markeer(v.id, "beantwoord")} className="inline-flex min-h-11 items-center rounded-[10px] border border-rand-interactief px-3 text-sm font-semibold text-actie-blauw hover:bg-blauw-zacht">
                      Beantwoord
                    </button>
                  )}
                  {v.status === "nieuw" && (
                    <button type="button" onClick={() => markeer(v.id, "apart")} className="inline-flex min-h-11 items-center rounded-[10px] px-3 text-sm font-semibold text-actie-blauw hover:bg-blauw-zacht">
                      Zet apart
                    </button>
                  )}
                  {v.status !== "nieuw" && (
                    <button type="button" onClick={() => markeer(v.id, "nieuw")} className="inline-flex min-h-11 items-center rounded-[10px] px-3 text-sm font-semibold text-actie-blauw hover:bg-blauw-zacht">
                      Terug naar vragen
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
