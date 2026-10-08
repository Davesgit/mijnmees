"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Melding } from "@/components/mees/Bouwstenen";
import { Icoon } from "@/components/mees/Icoon";
import { PrimaireKnop, SecundaireKnop, TekstKnop } from "@/components/mees/Knoppen";
import { Tekenbord, type ZonderTijd } from "@/features/tutorhulp/Tekenbord";
import { bordLimieten, type BordElement, type BordGebeurtenis, type BordOpname } from "@/features/tutorhulp/bord";
import { createClient } from "@/lib/supabase/client";
import { bewaarUitleg, vraagUploadLink } from "@/app/tutor/acties";

const MAX_OPNAME_MS = 10 * 60 * 1000;
type OpnameStatus = "uit" | "klaar-om-te-starten" | "neemt-op" | "opgenomen" | "bewaren";

function kiesMime() {
  if (typeof MediaRecorder === "undefined") return null;
  return ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/mp4", "audio/webm", "audio/aac"].find((m) => MediaRecorder.isTypeSupported(m)) ?? "";
}

const tijd = (ms: number) => `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, "0")}`;

/** U04: tekenbord met getypte tekst, breuken en breukmodellen; stem + bordgebeurtenissen samen opnemen. */
export function UitlegStudio({ uitleg }: { uitleg: { id: string; titel: string; bord: BordOpname; heeftOpname: boolean; duurMs: number | null } }) {
  const router = useRouter();
  const [titel, setTitel] = useState(uitleg.titel);

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
  // Het bord van dit moment (voor het begin van een opname en voor 'Bewaar concept').
  const huidig = useRef<BordElement[]>(uitleg.bord.elementen ?? []);
  const [bordStart, setBordStart] = useState<{ sleutel: number; elementen: BordElement[] }>({ sleutel: 0, elementen: uitleg.bord.elementen ?? [] });

  function opBord(g: ZonderTijd, na: BordElement[]) {
    huidig.current = na;
    if (status === "neemt-op" && gebeurtenissen.current.length < bordLimieten.gebeurtenissen) {
      gebeurtenissen.current.push({ ...g, t: Math.round(performance.now() - t0.current) } as BordGebeurtenis);
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
    begin.current = huidig.current;
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
    const r = await bewaarUitleg({ uitlegId: uitleg.id, titel, bord: { elementen: huidig.current, gebeurtenissen: [] }, audio: null }).catch(() => ({ ok: false, melding: undefined }));
    setMelding(r.ok ? { soort: "succes", tekst: "Het concept is bewaard. Er is nog niets verstuurd." } : { soort: "fout", tekst: r.melding ?? "Bewaren lukt nu niet." });
  }

  return (
    <div className="flex flex-col gap-5">
      <label className="flex flex-col gap-2 font-bold tablet:max-w-xl">
        Titel van de uitleg
        <input value={titel} onChange={(e) => setTitel(e.target.value.slice(0, 120))} className="min-h-12 rounded-[12px] border border-rand-interactief bg-wit px-4 font-normal" />
        <span className="tekst-klein font-normal text-tekst-zacht">Zonder naam van het kind.</span>
      </label>

      <Tekenbord key={bordStart.sleutel} begin={bordStart.elementen} onGebeurtenis={opBord} uitgeschakeld={status === "bewaren"} rand={neemtOp ? "border-2 border-fout" : ""} />

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
                  huidig.current = opname.bord.elementen;
                  setBordStart((b) => ({ sleutel: b.sleutel + 1, elementen: opname.bord.elementen }));
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
