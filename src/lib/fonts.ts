// lib/fonts.ts
import { Cormorant_Garamond, Zen_Maru_Gothic, Dekko } from "next/font/google";

export const garamond = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
});

export const zenMaru = Zen_Maru_Gothic({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const decol = Dekko({
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});
