import type { Metadata, Viewport } from "next";
import { Nunito_Sans } from "next/font/google";
import "./globals.css";

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
  icons: {
    icon: [{ url: "/assets/merk/favicon-32.png", sizes: "32x32", type: "image/png" }],
    apple: [{ url: "/assets/merk/favicon-180.png", sizes: "180x180" }],
  },
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
      <body className="flex min-h-dvh flex-col">{children}</body>
    </html>
  );
}
