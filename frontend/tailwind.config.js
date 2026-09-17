/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark theme palette - consistent across the entire app
        bg: {
          primary: '#0B0C10',
          secondary: '#101218',
          card: '#14161C',
          elevated: '#1A1D24',
        },
        border: 'rgba(255,255,255,0.08)',
        text: {
          primary: '#FFFFFF',
          secondary: '#9CA3AF',
          muted: '#6B7280',
        },
        accent: {
          DEFAULT: '#66FCF1',
          hover: '#4DE8CD',
          muted: 'rgba(102, 252, 241, 0.1)',
        },
        primary: {
          DEFAULT: '#66FCF1',
          hover: '#4DE8CD',
        },
        success: {
          DEFAULT: '#16a34a',
          hover: '#15803d',
        },
        danger: {
          DEFAULT: '#dc2626',
          hover: '#b91c1c',
        },
        warning: {
          DEFAULT: '#ca8a04',
          hover: '#a16207',
        },
        info: {
          DEFAULT: '#38bdf8',
          hover: '#0ea5e9',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '10px',
        sm: '8px',
        lg: '14px',
        xl: '18px',
        '2xl': '24px',
      },
      boxShadow: {
        DEFAULT: '0 1px 3px rgba(0, 0, 0, 0.3)',
        hover: '0 4px 12px rgba(0, 0, 0, 0.4)',
        card: '0 2px 8px rgba(0, 0, 0, 0.25)',
        elevated: '0 8px 24px rgba(0, 0, 0, 0.35)',
        glow: '0 0 20px rgba(102, 252, 241, 0.15)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'dropdown-enter': 'dropdownEnter 0.2s ease-out',
        'toast-in': 'toastIn 0.3s ease-out',
        'toast-out': 'toastOut 0.3s ease-in',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        dropdownEnter: {
          '0%': { opacity: '0', transform: 'scale(0.95) translateY(-4px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        toastIn: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        toastOut: {
          '0%': { opacity: '1', transform: 'translateX(0)' },
          '100%': { opacity: '0', transform: 'translateX(20px)' },
        },
      },
    },
  },
  plugins: [],
}