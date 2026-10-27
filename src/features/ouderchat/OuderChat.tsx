"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { Icoon } from "@/components/mees/Icoon";
import { Invoer, type Optie } from "@/features/chat/ChatInvoer";
import { VoortgangKaart } from "@/features/chat/ChatKaarten";
import { markeerNieuw, TypTekst } from "@/features/chat/ChatTypen";
import { MeesAfzender } from "@/features/chat/ChatVoorlezen";
import { ChatMenu, NaamVeld } from "@/features/chat/ChatOpties";
import type { Antwoord, Bericht, OuderStap } from "@/features/chat/gesprek";
import { maakBericht as bericht, ouderChats } from "@/features/chat/opslag";
import { useMeesBezig } from "@/features/chat/ritme";
import { useGespreksScroll } from "@/features/chat/useGespreksScroll";
import { antwoordOuder, ouderItems, ouderStartkaarten, reageerOuder, type OuderKind } from "./ouder-gesprek";

/**
 * De ouderchat: dezelfde chat als bij kinderen, maar Mees praat met de ouder. Voortgang per kind, samengevat in
 * gewone woorden, met suggesties voor thuis in de chatbalk. Gegevens komen van de server (`kinderen`).
 */
export function OuderChat({ kinderen, meldingen }: { kinderen: OuderKind[]; meldingen?: ReactNode }) {
  const router = useRouter();
  const params = useSearchParams();
  const chats = ouderChats.useChats();
  const [invoer, setInvoer] = useState("");
  const [hernoemen, setHernoemen] = useState(false);
  const [navigeert, startNavigatie] = useTransition();
  const meesBezig = useMeesBezig();

  const gesprek = chats?.actief ? (chats.gesprekken.find((g) => g.id === chats.actief) ?? null) : null;
  const laatste = gesprek?.berichten.at(-1);
  const { log, ruimte, markeerVerstuurd } = useGespreksScroll(gesprek?.id, `${gesprek?.id}-${gesprek?.berichten.length}`);

  const voegToe = (nieuw: Bericht[], titel?: string) => {
    markeerNieuw(nieuw.filter((b) => b.van === "mees"));
    const ik = nieuw.find((b) => b.van === "kind");
    if (ik) markeerVerstuurd(ik.id);
    ouderChats.voegToeAanActief(nieuw, { titel });
  };
  const meesZegt = (r: Antwoord) => bericht("mees", r.tekst, { keuzes: r.keuzes, kaart: r.kaart });

  function kies(label: string, stap: OuderStap, titel?: string) {
    if (stap.stap === "ga") {
      voegToe([bericht("kind", label), bericht("mees", "Ik open het voor je.")], titel);
      const href = stap.href;
      startNavigatie(() => router.push(href));
      return;
    }
    voegToe([bericht("kind", label), meesZegt(antwoordOuder(stap, kinderen))], titel);
  }

  function stuur(tekst: string) {
    const schoon = tekst.trim().slice(0, 500);
    if (!schoon) return;
    setInvoer("");
    voegToe([bericht("kind", schoon), meesZegt(reageerOuder(schoon, kinderen))]);
  }

  // Vanuit het menu ("Voortgang"): /ouder?vraag=voortgang start dat gesprek.
  const gestart = useRef(false);
  const vraag = params.get("vraag");
  useEffect(() => {
    if (vraag !== "voortgang" || chats === null || gestart.current) return;
    gestart.current = true;
    kies(kinderen.length === 1 ? `Hoe gaat het met ${kinderen[0]!.voornaam}?` : "Hoe gaat het met de kinderen?", { stap: "voortgang" }, "Voortgang");
    router.replace("/ouder");
  }, [vraag, chats]); // eslint-disable-line react-hooks/exhaustive-deps

  const opties: Optie<{ label: string; stap: OuderStap }>[] =
    laatste?.van === "mees" ? (laatste.keuzes ?? []).flatMap((k) => (k.soort === "ouder" ? [{ label: k.label, doe: { label: k.label, stap: k.doe } }] : [])) : [];

  const invoerVeld = (
    <Invoer
      waarde={invoer}
      onWijzig={setInvoer}
      onStuur={() => stuur(invoer)}
      onLuisteren={() => {}}
      plaatshouder={gesprek ? "Stel een vraag aan Mees…" : "Vraag Mees iets over je kind…"}
      kortePlaatshouder="Stel een vraag…"
      opties={opties}
      onOptie={(o) => kies(o.doe.label, o.doe.stap)}
      optiesWachten={meesBezig || navigeert}
    />
  );

  if (chats === null) return <div className="chat-achtergrond flex-1" aria-hidden />;

  if (!gesprek) {
    return (
      <div className="chat-achtergrond flex flex-1 flex-col items-center justify-center px-4 py-8 tablet:px-[7%] tablet:py-12">
        <section className="w-full text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/merk/mees-vogel.svg" alt="" className="mx-auto mb-4 h-24 w-auto tablet:h-28" />
          <p className="font-bold text-actie-blauw">Voor ouders</p>
          <h1 className="mt-1 text-[2.25rem] font-extrabold leading-tight tracking-tight tablet:text-[3rem]">Hallo! 👋</h1>
          <p className="mt-2 text-xl font-semibold text-[#5e6fa8] tablet:text-[1.5rem]">Waar kan ik je mee helpen?</p>
        </section>
        <div className="mt-6 w-full max-w-[1030px] tablet:mt-8">
          <div className="mx-auto tablet:w-[90%]">{invoerVeld}</div>
          <div className="mt-5 grid gap-3 tablet:gap-4 min-[1200px]:grid-cols-3 min-[1200px]:gap-5">
            {ouderStartkaarten(kinderen).map((k) => (
              <button
                key={k.titel}
                type="button"
                onClick={() => kies(k.vraag, k.stap, k.titel)}
                className="flex items-center gap-4 rounded-[24px] border border-[#e9f5ff] bg-wit/95 p-5 text-left shadow-[0_8px_24px_#92c5eb21] hover:bg-[#f1f9ff] tablet:gap-5 tablet:p-6"
              >
                <Icoon naam={k.icoon} className="size-10 shrink-0 text-actie-blauw" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[1.0625rem] font-bold">{k.titel}</span>
                  <span className="mt-1 block text-[0.9375rem] text-[#5e6fa8]">{k.tekst}</span>
                </span>
                <Icoon naam="chevron-rechts" className="size-7 shrink-0 text-[#5366a5]" />
              </button>
            ))}
          </div>
          {meldingen && <div className="mt-6 flex flex-col gap-3 text-left">{meldingen}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="chat-achtergrond flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-[860px] flex-1 flex-col px-4 pt-6 tablet:px-8 tablet:pt-10">
        <div className="flex items-center gap-1">
          {hernoemen ? (
            <NaamVeld gesprek={gesprek} onKlaar={() => setHernoemen(false)} className="w-full text-xl tablet:text-2xl" />
          ) : (
            <h1 className="min-w-0">
              <button type="button" onClick={() => setHernoemen(true)} title="Naam wijzigen" className="block max-w-full truncate rounded-[10px] px-1 text-left text-xl font-extrabold hover:bg-blauw-zacht tablet:text-2xl">
                {gesprek.titel}
                <span className="sr-only"> (tik om de naam te wijzigen)</span>
              </button>
            </h1>
          )}
          <ChatMenu gesprek={gesprek} onHernoem={() => setHernoemen(true)} />
        </div>
        <div ref={log} role="log" aria-live="polite" aria-label="Gesprek met Mees" className="mt-4 flex flex-col gap-3 pb-6">
          {gesprek.berichten.map((b) => {
            if (b.van === "kind")
              return (
                <div key={b.id} data-stap={b.id} className="ml-auto max-w-[85%] whitespace-pre-wrap break-words rounded-[20px] bg-[#e0f2ff] px-5 py-3.5 text-lg">
                  <span className="sr-only">Jij: </span>
                  {b.tekst}
                </div>
              );
            const kind = b.kaart?.soort === "ouderVoortgang" ? kinderen.find((k) => k.id === (b.kaart as { kindId: string }).kindId) : undefined;
            return (
              <div key={b.id} data-stap={b.id} className="w-full rounded-[20px] border border-[#e9f5ff] bg-wit px-5 py-4 shadow-[0_8px_24px_#92c5eb17] tablet:max-w-[92%]">
                <MeesAfzender />
                <TypTekst id={b.id} tekst={b.tekst} className="mt-2 whitespace-pre-wrap break-words text-lg leading-relaxed">
                  {kind && b.kaart?.soort === "ouderVoortgang" && <VoortgangKaart items={ouderItems(kind, b.kaart.filter)} filter={b.kaart.filter} voorOuder />}
                </TypTekst>
              </div>
            );
          })}
        </div>
        <div ref={ruimte} aria-hidden />
      </div>
      <div data-sticky-onder className="sticky bottom-0 z-10 border-t border-[#dcebf8] bg-[#f5fbff] px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_24px_#69b5ec1a] tablet:px-8">
        <div className="mx-auto max-w-[860px]">{invoerVeld}</div>
      </div>
    </div>
  );
}
