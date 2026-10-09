import type { Metadata, Viewport } from "next";
import { Nunito_Sans } from "next/font/google";
import "./globals.css";
import { WebappRegistratie } from "@/components/mees/Webapp";

const meesSans = Nunito_Sans({
  variable: "--font-mees-sans",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://mijnmees.nl"),
  title: {
    default: "Mees – gratis leren en oefenen",
    template: "%s · Mees",
  },
  description: "Gratis leren en oefenen voor kinderen van groep 5 tot en met 8.",
  applicationName: "Mees",
  icons: {
    icon: [
      { url: "/assets/merk/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/app/icoon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/app/apple-touch-icon.png", sizes: "180x180" }],
  },
  appleWebApp: { capable: true, title: "Mees", statusBarStyle: "default" },
  formatDetection: { telephone: false },
  openGraph: {
    title: "Mees – gratis leren en oefenen",
    description: "Gratis leren en oefenen voor kinderen van groep 5 tot en met 8.",
    images: [{ url: "/assets/merk/deelafbeelding.png", width: 1200, height: 630 }],
    locale: "nl_NL",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="nl" className={`${meesSans.variable} antialiased`}>
      <body className="flex min-h-dvh flex-col">
        {children}
        <WebappRegistratie />
      </body>
    </html>
  );
}
