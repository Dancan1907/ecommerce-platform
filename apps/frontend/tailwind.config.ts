import type { Config } from 'tailwindcss';

/**
 * Tailwind Configuration — E-Commerce Design System
 *
 * Palette: Artisanal / Warm
 *  - Primary: Forest Green (#1A3D2E) + Cream (#F5F1E8)
 *  - Accent: Emerald (#10B981)
 *  - Typography: Fraunces (serif headings) + Plus Jakarta Sans (body)
 */
const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // ============================================
      // COLORS — Semantic tokens + brand palette
      // ============================================
      colors: {
        // Brand: Forest
        forest: {
          50: '#f0f7f3',
          100: '#dceee3',
          200: '#badcc9',
          300: '#8bc2a5',
          400: '#5aa17d',
          500: '#3d8360',
          600: '#2d684c',
          700: '#26553f',
          800: '#1A3D2E', // Primary header
          900: '#143025',
          950: '#0A1A14', // Deep midnight emerald
        },
        // Brand: Cream
        cream: {
          50: '#FDFBF7',
          100: '#FAF7F0',
          200: '#F5F1E8', // Primary light bg
          300: '#EBE4D5',
          400: '#DDD2BC',
          500: '#C9B893',
        },
        // Brand: Emerald (accent / CTA)
        emerald: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10B981', // Bright accent
          600: '#059669', // CTA default
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        // Mint soft text (dark mode)
        mint: {
          100: '#E5F1EA',
          200: '#D4E8D8', // Primary dark-mode text
          300: '#A1B8AC', // Secondary dark-mode text
        },
        // Neutral scale
        ink: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181B', // Headings light mode
          950: '#09090b',
        },
      },

      // ============================================
      // TYPOGRAPHY
      // ============================================
      fontFamily: {
        serif: ['var(--font-fraunces)', 'Georgia', 'serif'],
        sans: ['var(--font-plus-jakarta)', 'system-ui', 'sans-serif'],
      },

      // ============================================
      // SPACING / RADII / SHADOWS
      // ============================================
      borderRadius: {
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.25rem',
      },
      boxShadow: {
        soft: '0 4px 20px -4px rgba(26, 61, 46, 0.08)',
        'soft-lg': '0 12px 40px -8px rgba(26, 61, 46, 0.12)',
        glow: '0 0 24px -4px rgba(16, 185, 129, 0.4)',
      },

      // ============================================
      // BACKDROP BLUR (used by glass utilities)
      // ============================================
      backdropBlur: {
        glass: '12px',
      },

      // ============================================
      // ANIMATIONS
      // ============================================
      animation: {
        'fade-in': 'fadeIn 0.4s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
