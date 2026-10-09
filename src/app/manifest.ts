import type { MetadataRoute } from "next";

/** Webapp: Mees als app op het beginscherm (schermvullend, eigen icoon). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Mees – gratis leren en oefenen",
    short_name: "Mees",
    description: "Gratis leren en oefenen voor kinderen van groep 5 tot en met 8.",
    lang: "nl",
    dir: "ltr",
    start_url: "/kind/start?bron=app",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    categories: ["education", "kids"],
    icons: [
      { src: "/app/icoon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/app/icoon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/app/icoon-maskeerbaar-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/app/icoon-maskeerbaar-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Oefenen", url: "/kind/start?bron=app", icons: [{ src: "/app/icoon-192.png", sizes: "192x192" }] },
      { name: "Voor ouders", url: "/ouder", icons: [{ src: "/app/icoon-192.png", sizes: "192x192" }] },
    ],
  };
}
