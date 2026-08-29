/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'rgb(var(--brand-primary) / <alpha-value>)',
          hover: 'rgb(var(--brand-primary-hover) / <alpha-value>)',
          light: 'rgb(var(--brand-primary-light) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'rgb(var(--brand-secondary) / <alpha-value>)',
          hover: 'rgb(var(--brand-secondary-hover) / <alpha-value>)',
          light: 'rgb(var(--brand-secondary-light) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--brand-accent) / <alpha-value>)',
          hover: 'rgb(var(--brand-accent-hover) / <alpha-value>)',
          light: 'rgb(var(--brand-accent-light) / <alpha-value>)',
        },
        success: {
          DEFAULT: 'rgb(var(--brand-success) / <alpha-value>)',
          hover: 'rgb(var(--brand-success-hover) / <alpha-value>)',
          light: 'rgb(var(--brand-success-light) / <alpha-value>)',
        },
        danger: {
          DEFAULT: 'rgb(var(--brand-danger) / <alpha-value>)',
          hover: 'rgb(var(--brand-danger-hover) / <alpha-value>)',
          light: 'rgb(var(--brand-danger-light) / <alpha-value>)',
        },
        warning: {
          DEFAULT: 'rgb(var(--brand-warning) / <alpha-value>)',
          hover: 'rgb(var(--brand-warning-hover) / <alpha-value>)',
          light: 'rgb(var(--brand-warning-light) / <alpha-value>)',
        },
        info: {
          DEFAULT: 'rgb(var(--brand-info) / <alpha-value>)',
          hover: 'rgb(var(--brand-info-hover) / <alpha-value>)',
          light: 'rgb(var(--brand-info-light) / <alpha-value>)',
        },
        ink: {
          DEFAULT: '#15171b',
          soft: '#1d2026',
          muted: '#3a3f47',
        },
        cream: '#eef2ee',
        dappr: {
          green: '#9be05a',
          greenSoft: '#9be05a26',
          red: '#ef5b6b',
          redSoft: '#ef5b6b26',
        },
        background: 'rgb(var(--color-background) / <alpha-value>)',
        card: 'rgb(var(--color-card) / <alpha-value>)',
        surface: 'var(--surface)',
        navbar: 'rgb(var(--color-navbar) / <alpha-value>)',
        'text-primary': 'rgb(var(--color-text-primary) / <alpha-value>)',
        'text-secondary': 'rgb(var(--color-text-secondary) / <alpha-value>)',
        'text-tertiary': 'rgb(var(--color-text-tertiary) / <alpha-value>)',
        border: 'rgb(var(--color-border) / <alpha-value>)',
        hover: 'rgb(var(--color-hover) / <alpha-value>)',
        input: 'rgb(var(--color-input) / <alpha-value>)',
        'table-header': 'rgb(var(--color-table-header) / <alpha-value>)',
        badge: {
          blue: 'rgb(var(--brand-primary) / 0.15)',
          green: 'rgb(var(--brand-success) / 0.15)',
          yellow: 'rgb(var(--brand-warning) / 0.15)',
          red: 'rgb(var(--brand-danger) / 0.15)',
        },
      },
        // Be Vietnam Pro is set once on <body> in index.css; dashboards inherit
        // it from the root. Keep font-sans/display as no-op `inherit` fallbacks
        // so existing `font-sans`/`font-display` classes don't override it.
        fontFamily: {
          sans: ['Inter', 'sans-serif'],
          display: ['Sora', 'sans-serif'],
        },
      fontWeight: {
        heading: '700',
        body: '400',
        button: '600',
      },
      borderRadius: {
        card: '18px',
        'card-sm': '12px',
        'card-lg': '24px',
      },
      borderWidth: {
        '3': '3px',
      },
      boxShadow: {
        card: '0 4px 20px rgba(15, 23, 42, 0.04)',
        'card-hover': '0 10px 30px rgba(15, 23, 42, 0.08)',
        'sidebar': '0 0 30px rgba(15, 23, 42, 0.12)',
        'glass': '0 8px 32px rgba(15, 23, 42, 0.06)',
      },
      spacing: {
        '18': '72px',
        '22': '88px',
        '70': '280px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'slide-down': 'slideDown 0.3s ease-out forwards',
        'slide-left': 'slideLeft 0.3s ease-out forwards',
        'slide-right': 'slideRight 0.3s ease-out forwards',
        'scale-in': 'scaleIn 0.3s ease-out forwards',
        'zoom-in': 'zoomIn 0.3s ease-out forwards',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'shimmer': 'shimmer 2s linear infinite',
        'counter': 'counter 2s ease-out forwards',
        'typing': 'typing 3.5s steps(40, end), blink-caret 0.75s step-end infinite',
        'ripple': 'ripple 0.6s linear',
        'sidebar-expand': 'sidebarExpand 0.3s ease-out forwards',
        'sidebar-collapse': 'sidebarCollapse 0.3s ease-out forwards',
        'dropdown': 'dropdown 0.2s ease-out forwards',
        'modal': 'modalIn 0.3s ease-out forwards',
        'toast': 'toastIn 0.3s ease-out forwards',
        'toast-out': 'toastOut 0.3s ease-in forwards',
        'progress': 'progress 1.5s ease-out forwards',
        'skeleton': 'skeleton 1.5s ease-in-out infinite',
        'page-transition': 'pageTransition 0.4s ease-out forwards',
        'fade-out': 'fadeOut 0.3s ease-in forwards',
        'scale-out': 'scaleOut 0.2s ease-in forwards',
        'shake': 'shake 0.5s ease-in-out',
        'bounce-in': 'bounceIn 0.5s ease-out forwards',
        'accordion-down': 'accordionDown 0.3s ease-out forwards',
        'accordion-up': 'accordionUp 0.3s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideLeft: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideRight: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        scaleOut: {
          '0%': { opacity: '1', transform: 'scale(1)' },
          '100%': { opacity: '0', transform: 'scale(0.95)' },
        },
        zoomIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(37, 99, 235, 0.3)' },
          '100%': { boxShadow: '0 0 40px rgba(37, 99, 235, 0.6)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        counter: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        typing: {
          'from': { width: '0' },
          'to': { width: '100%' },
        },
        'blink-caret': {
          'from, to': { borderColor: 'transparent' },
          '50%': { borderColor: 'currentColor' },
        },
        ripple: {
          '0%': { transform: 'scale(0)', opacity: '0.5' },
          '100%': { transform: 'scale(4)', opacity: '0' },
        },
        sidebarExpand: {
          '0%': { width: '72px' },
          '100%': { width: '280px' },
        },
        sidebarCollapse: {
          '0%': { width: '280px' },
          '100%': { width: '72px' },
        },
        dropdown: {
          '0%': { opacity: '0', transform: 'translateY(-10px) scale(0.95)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        modalIn: {
          '0%': { opacity: '0', transform: 'scale(0.9) translateY(20px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        toastIn: {
          '0%': { opacity: '0', transform: 'translateX(100%)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        toastOut: {
          '0%': { opacity: '1', transform: 'translateX(0)' },
          '100%': { opacity: '0', transform: 'translateX(100%)' },
        },
        progress: {
          '0%': { width: '0%' },
          '100%': { width: 'var(--progress-width)' },
        },
        skeleton: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pageTransition: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-5px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(5px)' },
        },
        bounceIn: {
          '0%': { opacity: '0', transform: 'scale(0.3)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        accordionDown: {
          '0%': { height: '0', opacity: '0' },
          '100%': { height: 'var(--radix-accordion-content-height)', opacity: '1' },
        },
        accordionUp: {
          '0%': { height: 'var(--radix-accordion-content-height)', opacity: '1' },
          '100%': { height: '0', opacity: '0' },
        },
      },
      transitionDuration: {
        '400': '400ms',
        '600': '600ms',
      },
      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'shimmer': 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
      },
    },
  },
  plugins: [],
}