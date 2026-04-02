/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif']
      },
      colors: {
        teal:   { DEFAULT: '#00a88a', bright: '#00c9a7', dark: '#007d68' },
        purple: { DEFAULT: '#5b3f8f', mid: '#7c5cbf', light: '#9b7fd4' },
        blue:   { DEFAULT: '#2d5fc4', light: '#4a86e8' },
        cyan:   '#0099bb',
        nap: {
          bg:       '#f0edf8',
          surface:  '#ffffff',
          text:     '#1a0e2e',
          'text-2': '#5a4d6e',
          'text-3': '#8e82a0',
          'text-4': '#bdb4cc',
          border:   'rgba(91,63,143,0.14)',
        }
      },
      backgroundImage: {
        'grad-primary':  'linear-gradient(135deg,#5b3f8f 0%,#2d5fc4 50%,#0099bb 100%)',
        'grad-accent':   'linear-gradient(135deg,#00a88a 0%,#0099bb 50%,#2d5fc4 100%)',
        'grad-danger':   'linear-gradient(135deg,#e83a5a,#f0732e)',
        'grad-warn':     'linear-gradient(135deg,#e89d30,#e07e24)',
        'grad-card':     'linear-gradient(145deg,rgba(255,255,255,0.9) 0%,rgba(240,237,252,0.7) 100%)',
        'shimmer':       'linear-gradient(90deg,transparent,rgba(255,255,255,0.55),transparent)',
      },
      boxShadow: {
        'nap':        '0 2px 12px rgba(91,63,143,0.08)',
        'nap-md':     '0 4px 20px rgba(91,63,143,0.12)',
        'nap-glow':   '0 0 20px rgba(0,168,138,0.18)',
        'nap-purple': '0 4px 20px rgba(91,63,143,0.22)',
        'nap-card':   '0 12px 36px rgba(91,63,143,0.15),0 0 20px rgba(91,63,143,0.08)',
        'nap-teal':   '0 0 0 3px rgba(0,168,138,0.12)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translate3d(0,14px,0)' },
          to:   { opacity: '1', transform: 'translate3d(0,0,0)' }
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' }
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translate3d(32px,0,0)' },
          to:   { opacity: '1', transform: 'translate3d(0,0,0)' }
        },
        'orb1': {
          '0%,100%': { transform: 'translate3d(0,0,0) scale(1)' },
          '33%':     { transform: 'translate3d(40px,-30px,0) scale(1.05)' },
          '66%':     { transform: 'translate3d(-20px,20px,0) scale(0.97)' }
        },
        'orb2': {
          '0%,100%': { transform: 'translate3d(0,0,0) scale(1)' },
          '33%':     { transform: 'translate3d(-50px,30px,0) scale(1.03)' },
          '66%':     { transform: 'translate3d(30px,-20px,0) scale(0.98)' }
        },
        'pulse-glow': {
          '0%,100%': { boxShadow: '0 0 0 0 rgba(0,168,138,0)' },
          '50%':     { boxShadow: '0 0 0 6px rgba(0,168,138,0.15)' }
        },
        'shimmer': {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition:  '200% center' }
        },
      },
      animation: {
        'fade-up':        'fade-up 220ms cubic-bezier(.22,1,.36,1) both',
        'fade-in':        'fade-in 180ms ease both',
        'slide-in-right': 'slide-in-right 240ms cubic-bezier(.22,1,.36,1) both',
        'orb1':           'orb1 18s ease-in-out infinite',
        'orb2':           'orb2 22s ease-in-out infinite',
        'pulse-glow':     'pulse-glow 1.4s ease-in-out infinite',
        'shimmer':        'shimmer 2.5s ease-in-out infinite',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(.34,1.56,.64,1)',
        'smooth': 'cubic-bezier(.4,0,.2,1)',
      }
    }
  },
  plugins: []
}
