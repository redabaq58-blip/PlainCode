import type { Config } from "tailwindcss";

// In Tailwind v4, most configuration moves to CSS via @theme.
// This file provides only the content scanning config.
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
};
export default config;
