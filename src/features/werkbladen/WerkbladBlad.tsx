import { Breuk } from "@/components/mees/Breuk";
import { vindVraag, type Vraag } from "@/features/oefenen/vragen";
import type { Werkblad } from "./werkblad";

const uitleg: Record<"breuk" | "tafel", string> = {
  breuk: "Vul in: <, > of =.",
  tafel: "Schrijf het antwoord op de lijn.",
};

/**
 * Het werkblad als A4. Echte HTML-tekst en opgebouwde breuken (geen afbeeldingen), schoon te printen.
 * Met `metAntwoorden` is het het gekoppelde antwoordblad: dezelfde vragen, met het antwoord ingevuld.
 */
export function WerkbladBlad({ werkblad, metAntwoorden = false, beperkTot }: { werkblad: Pick<Werkblad, "code" | "titel" | "vragen">; metAntwoorden?: boolean; beperkTot?: number }) {
  const vragen = werkblad.vragen.map((v) => vindVraag(v.vraagId)).filter((v): v is Vraag => v !== null && v.soort !== "europa");
  const getoond = beperkTot ? vragen.slice(0, beperkTot) : vragen;
  const groepen = (["breuk", "tafel"] as const).map((soort) => ({ soort, vragen: getoond.filter((v) => v.soort === soort) })).filter((g) => g.vragen.length);
  let nummer = 0;

  return (
    <article className="werkblad mx-auto w-full max-w-[210mm] bg-wit p-6 text-inkt shadow-zwevend print:max-w-none print:p-0 print:shadow-none tablet:p-10">
      <header className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/merk/logo-liggend.png" alt="Mees" className="h-9 w-auto" />
        </div>
        <span className="rounded-full bg-blauw-zacht px-3 py-1 text-sm font-bold tabular-nums print:border print:border-rand-zacht">{werkblad.code}</span>
      </header>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold leading-tight tablet:text-[1.75rem]">{metAntwoorden ? `Antwoordblad · ${werkblad.titel.replace(/^Rekenen · /, "")}` : werkblad.titel}</h1>
          <p className="mt-1 text-base text-tekst-zacht">{metAntwoorden ? "Hoort bij werkblad " + werkblad.code + ". Kijk samen na." : "Schrijf je antwoorden bij de vragen."}</p>
        </div>
        {!metAntwoorden && (
          <p className="flex items-end gap-2 text-base font-semibold">
            Voornaam: <span className="inline-block w-40 border-b-2 border-inkt" />
          </p>
        )}
      </div>

      {groepen.map((g) => (
        <section key={g.soort} className="mt-6 break-inside-avoid">
          <h2 className="text-lg font-bold">
            {g.soort === "breuk" ? "Breuken vergelijken" : "Tafels"} <span className="font-normal text-tekst-zacht">· {uitleg[g.soort]}</span>
          </h2>
          <ol className="mt-3 grid grid-cols-1 gap-x-8 gap-y-4 min-[480px]:grid-cols-2 print:grid-cols-2">
            {g.vragen.map((v) => {
              nummer++;
              return (
                <li key={v.id} className="flex min-h-20 break-inside-avoid items-center gap-4 rounded-[12px] border border-rand-zacht px-4 py-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-blauw-zacht text-sm font-bold print:border print:border-rand-zacht">{nummer}</span>
                  {v.soort === "breuk" ? (
                    <span className="flex items-center gap-4 text-2xl font-bold">
                      <Breuk teller={v.visual.links[0]} noemer={v.visual.links[1]} />
                      <span className={`grid h-12 w-14 place-items-center rounded-[8px] border-2 ${metAntwoorden ? "border-actie-blauw text-actie-blauw" : "border-rand-interactief"}`}>
                        {metAntwoorden ? v.answer : ""}
                      </span>
                      <Breuk teller={v.visual.rechts[0]} noemer={v.visual.rechts[1]} />
                    </span>
                  ) : v.soort === "tafel" ? (
                    <span className="flex items-end gap-3 text-2xl font-bold tabular-nums">
                      {v.links} {v.bewerking === "x" ? "×" : ":"} {v.rechts} =
                      <span className={`inline-block min-w-16 border-b-2 border-inkt text-center ${metAntwoorden ? "text-actie-blauw" : ""}`}>{metAntwoorden ? v.answer : " "}</span>
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </section>
      ))}

      <footer className="mt-8 flex justify-between border-t border-rand-zacht pt-3 text-sm text-tekst-zacht">
        <span>mijnmees.nl · gratis oefenen</span>
        <span>{werkblad.code}</span>
      </footer>
    </article>
  );
}
