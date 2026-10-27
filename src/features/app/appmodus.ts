// App-modus: dezelfde website, maar binnen de Mees-app (Capacitor) zonder doneren, landingspagina en tutor/beheer.
// De app voegt APP_KENMERK toe aan de user agent. Testen in een gewone browser: ?app=1 (aan) of ?app=0 (uit).

/** Staat in de user agent van de Mees-app (Capacitor: appendUserAgent). */
export const APP_KENMERK = "MeesApp";
/** Cookie voor testen in een gewone browser. */
export const APP_COOKIE = "mees_app";
/** Eerste scherm van de app: de chat. */
export const APP_START = "/kind/start";

/** Pagina's die niet in de app horen (het pad zelf en alles eronder). */
const NIET_IN_APP = ["/donateurs", "/tutoren", "/tutor", "/beheer", "/over-mees", "/welkom"];

export function isAppVerzoek(userAgent: string | null, cookie: string | undefined) {
  return cookie === "1" || (userAgent ?? "").includes(APP_KENMERK);
}

/** Waar de app naartoe gaat in plaats van dit pad, of null als het pad in de app mag. */
export function appDoorsturing(pad: string): string | null {
  if (pad === "/") return APP_START;
  return NIET_IN_APP.some((p) => pad === p || pad.startsWith(`${p}/`)) ? APP_START : null;
}

/** Zet vóór de eerste weergave data-app op <html>, zodat .alleen-web direct verborgen is (geen flits). */
export const appModusScript = `try{if(navigator.userAgent.indexOf(${JSON.stringify(APP_KENMERK)})>-1||/(?:^|; )${APP_COOKIE}=1(?:;|$)/.test(document.cookie))document.documentElement.dataset.app="true"}catch(e){}`;
