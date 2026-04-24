import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#FFFFFF',
        surface: '#F9F9F8',
        border: '#E8E8E3',
        foreground: '#1A1A1A',
        'foreground-secondary': '#6B7280',
        'foreground-muted': '#9CA3AF',
        accent: '#F59E0B',
        'accent-dark': '#D97706',
        navy: '#0F172A',
        'navy-hover': '#1E293B',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        info: '#3B82F6',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      },
      maxWidth: {
        content: '1200px',
      },
    },
  },
  plugins: [],
} satisfies Config
