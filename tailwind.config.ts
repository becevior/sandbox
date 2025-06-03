import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      backgroundImage: {
        'grid-mortal-kombat': 'linear-gradient(to right, #333 1px, transparent 1px), linear-gradient(to bottom, #333 1px, transparent 1px)',
      },
      animation: {
        'torch-flicker': 'flicker 2s ease-in-out infinite',
        'fighter-stance': 'stance 1s ease-in-out infinite',
        'pulse': 'pulse 1s infinite',
        'winner-text': 'winner 2s ease-in-out infinite',
      },
      keyframes: {
        flicker: {
          '0%, 100%': { opacity: '1', transform: 'scale(1.0)' },
          '50%': { opacity: '0.8', transform: 'scale(0.9)' },
        },
        stance: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        winner: {
          '0%, 100%': { transform: 'scale(1.0)' },
          '50%': { transform: 'scale(1.1)' },
        },
      },
      dropShadow: {
        'glow': '0 0 8px rgba(255, 255, 255, 0.7)',
      },
      transformOrigin: {
        'bottom': 'bottom',
      },
      transform: {
        'rotateX-60': 'rotateX(60deg)',
      },
      perspective: {
        '1000': '1000px',
      },
    },
  },
  plugins: [],
};
export default config;
