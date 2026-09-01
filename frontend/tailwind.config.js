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
        primary:   { DEFAULT: '#F59E0B', hover: '#D97706', light: '#FED7AA' },
        secondary: { DEFAULT: '#2563EB', hover: '#1D4ED8', light: '#BFDBFE' },
        accent:    { DEFAULT: '#F59E0B', hover: '#D97706', light: '#FED7AA' },
        success:   { DEFAULT: '#10B981', hover: '#059669', light: '#D1FAE5' },
        danger:    { DEFAULT: '#EF4444', hover: '#DC2626', light: '#FEE2E2' },
        warning:   { DEFAULT: '#F59E0B', hover: '#D97706', light: '#FEF3C7' },
        info:      { DEFAULT: '#38BDF8', hover: '#0284C7', light: '#CFFAFE' },
        background: '#0B0F19',
        card:       '#151C2C',
        surface:    '#111827',
        navbar:     '#111827',
        border:     '#1E293D',
        hover:      '#1E293D',
        input:      '#151C2C',
        sidebar:    '#111827',
        'text-primary':   '#F8FAFC',
        'text-secondary': '#94A3B8',
        'text-tertiary':  '#64748B',
        amber: '#F59E0B',
        'table-header': '#1E293D',
      },
      fontFamily: {
        sans: ['Inter','sans-serif'],
        display: ['Plus Jakarta Sans','sans-serif'],
        mono: ['Inter','sans-serif'],
      },
      borderRadius: {
        card: '18px',
        sm: '8px',
        md: '12px',
        lg: '18px',
        xl: '24px',
      },
      borderWidth: {
        3: '3px',
      },
      boxShadow: {
        card:       '0 4px 20px rgba(0,0,0,0.35)',
        'card-hover': '0 10px 30px rgba(0,0,0,0.45)',
        sidebar:    '0 0 30px rgba(0,0,0,0.45)',
        glass:      '0 8px 32px rgba(0,0,0,0.45)',
      },
      aspectRatio: {
        '1/1': '1 / 1',
        '16/9': '16 / 9',
        '4/3': '4 / 3',
        '21/9': '21 / 9',
      },
      keyframes: {
        ripple: {
          '0%': { transform: 'scale(0)', opacity: '0.4' },
          '100%': { transform: 'scale(2.5)', opacity: '0' },
        },
        dropdown: {
          '0%': { opacity: '0', transform: 'translateY(-6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        modal: {
          '0%': { opacity: '0', transform: 'translateY(8px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        toast: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        skeleton: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        'accordion-down': {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'page-transition': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        typing: {
          '0%, 100%': { width: '2px' },
          '50%': { width: '100%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
      animation: {
        ripple: 'ripple 0.6s ease-out',
        dropdown: 'dropdown 0.15s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        modal: 'modal 0.25s ease-out',
        toast: 'toast 0.25s ease-out',
        skeleton: 'skeleton 1.5s ease-in-out infinite',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'page-transition': 'page-transition 0.4s ease-out',
        typing: 'typing 2s steps(20) infinite',
        float: 'float 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}