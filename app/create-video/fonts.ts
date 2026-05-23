// Caption fonts for the upload editor. Loaded at build time via next/font;
// only the generated className strings are passed to the client component.
import { Inter, Poppins, Montserrat, Bebas_Neue, Anton } from "next/font/google";

const inter = Inter({ subsets: ["latin"], weight: ["400", "600", "700"], display: "swap" });
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "600", "700"], display: "swap" });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "600", "700"], display: "swap" });
const bebas = Bebas_Neue({ subsets: ["latin"], weight: ["400"], display: "swap" });
const anton = Anton({ subsets: ["latin"], weight: ["400"], display: "swap" });

export type CaptionFont = { id: string; name: string; className: string };

export const CAPTION_FONTS: CaptionFont[] = [
  { id: "anton", name: "Anton", className: anton.className },
  { id: "bebas", name: "Bebas Neue", className: bebas.className },
  { id: "montserrat", name: "Montserrat", className: montserrat.className },
  { id: "poppins", name: "Poppins", className: poppins.className },
  { id: "inter", name: "Inter", className: inter.className },
];
