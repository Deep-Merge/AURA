import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import logo from "../../logo.png";
import "./globals.css";

const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-serif",
  display: "swap",
});

const sans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "AURA — Luxury Travel & Curated Journeys",
    template: "%s — AURA",
  },
  description: "Thoughtfully curated escapes for those who believe the journey should be as remarkable as the destination.",
  icons: { icon: logo.src },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
