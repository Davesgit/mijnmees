// Is Supabase traag of onbereikbaar, dan mag een pagina daar niet op blijven hangen. Zonder grens probeert de
// sessiecontrole het ruim een halve minuut opnieuw, en de pagina laadt dan pas daarna (of nooit).

/** Fetch met een maximale wachttijd per verzoek, voor de Supabase-clients. */
export function fetchMetTijdslimiet(ms = 5000): typeof fetch {
  return (input, init) => {
    const grens = AbortSignal.timeout(ms);
    return fetch(input, { ...init, signal: init?.signal ? AbortSignal.any([init.signal, grens]) : grens });
  };
}

/** Wacht hooguit `ms` op `belofte`; daarna (of bij een fout) geldt `anders`. */
export function binnen<T>(belofte: Promise<T>, ms: number, anders: T): Promise<T> {
  return Promise.race([belofte.catch(() => anders), new Promise<T>((klaar) => setTimeout(() => klaar(anders), ms))]);
}
