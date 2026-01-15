/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Argos Design System - "Ancient Greece meets Modern Tech"
        sand: '#F5F0E8',
        parchment: '#EDE6D8',
        marble: '#FAFAFA',
        terracotta: {
          DEFAULT: '#C67B5C',
          dark: '#A66347',
          light: '#D69B82',
        },
        olive: {
          DEFAULT: '#7B8B6F',
          dark: '#5E6B54',
          light: '#9AAB8E',
        },
        charcoal: '#2D2D2D',
        bronze: {
          DEFAULT: '#A5845E',
          dark: '#8B6B48',
          light: '#C4A87A',
        },
        // shadcn/ui compatibility
        border: '#E5DED4',
        input: '#E5DED4',
        ring: '#C67B5C',
        background: '#F5F0E8',
        foreground: '#2D2D2D',
        primary: {
          DEFAULT: '#C67B5C',
          foreground: '#FAFAFA',
        },
        secondary: {
          DEFAULT: '#7B8B6F',
          foreground: '#FAFAFA',
        },
        destructive: {
          DEFAULT: '#DC3545',
          foreground: '#FAFAFA',
        },
        muted: {
          DEFAULT: '#EDE6D8',
          foreground: '#6B6B6B',
        },
        accent: {
          DEFAULT: '#A5845E',
          foreground: '#FAFAFA',
        },
        card: {
          DEFAULT: '#FAFAFA',
          foreground: '#2D2D2D',
        },
        popover: {
          DEFAULT: '#FAFAFA',
          foreground: '#2D2D2D',
        },
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 2px 8px rgba(45, 45, 45, 0.06)',
        'card-hover': '0 4px 16px rgba(45, 45, 45, 0.1)',
        'tablet': '0 2px 8px rgba(54, 69, 79, 0.08)',
        'tablet-hover': '0 4px 16px rgba(54, 69, 79, 0.12)',
      },
      borderRadius: {
        lg: '12px',
        md: '8px',
        sm: '4px',
        'tablet': '12px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      maxWidth: {
        'prose': '65ch',
      },
      lineHeight: {
        'relaxed': '1.75',
      },
    },
  },
  plugins: [],
}
