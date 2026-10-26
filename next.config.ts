import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  async headers() {
    return [
      // De service worker altijd vers ophalen, zodat updates direct werken.
      { source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }, { key: "Service-Worker-Allowed", value: "/" }] },
    ];
  },
  // De chat met Mees is de enige werkplek voor kinderen: oude kinderpagina's sturen door naar de chat.
  // (Europa, lessen en tutorhulp volgen later; die blijven nog bereikbaar.)
  async redirects() {
    return ["/kind/rekenen/:pad*", "/kind/tafeltrainer/:pad*", "/kind/voortgang", "/kind/weetjesboek", "/kind/weetjes/:pad*", "/kind/oefening/instellen", "/kind/niveaubepaling/:pad*"].map(
      (source) => ({ source, destination: "/kind/start", permanent: false }),
    );
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
