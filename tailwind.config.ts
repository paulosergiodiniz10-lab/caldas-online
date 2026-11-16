import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
    "bg-orange-500",
    "bg-red-500",
    "bg-red-600",
    "bg-red-700",
    "bg-blue-600",
    "bg-blue-900",
    "bg-emerald-500",
    "bg-emerald-600",
    "bg-purple-600",
    "bg-amber-500",
    "bg-amber-600",
    "bg-slate-600",
    "bg-pink-500",
    "bg-teal-500",
    "bg-teal-600",
    "bg-indigo-600",
    "bg-yellow-500",
    "bg-sky-500",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
