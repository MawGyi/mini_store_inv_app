/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#212121',
          light: '#424242',
          faint: '#757575',
        },
        paper: {
          DEFAULT: '#F9F7F2',
          dark: '#F0EDE6',
          card: '#FFFEF9',
          warm: '#F5F0E1',
        },
        crimson: {
          DEFAULT: '#C41E3A',
          dark: '#9B1B30',
          light: '#E8475D',
          faint: 'rgba(196, 30, 58, 0.08)',
        },
        gold: {
          DEFAULT: '#FBC02D',
          dark: '#F9A825',
          light: '#FFF176',
          faint: 'rgba(251, 192, 45, 0.12)',
        },
        success: {
          DEFAULT: '#2E7D32',
          light: '#4CAF50',
          faint: 'rgba(46, 125, 50, 0.08)',
        },
        warning: {
          DEFAULT: '#E65100',
          light: '#FF9800',
          faint: 'rgba(230, 81, 0, 0.08)',
        },
      },
      fontFamily: {
        heading: ['Caveat Brush', 'Caveat', 'cursive'],
        body: ['Mali', 'Nunito', 'sans-serif'],
      },
      boxShadow: {
        'ink-sm': '2px 2px 0px #212121',
        'ink': '3px 3px 0px #212121',
        'ink-lg': '4px 4px 0px #212121',
        'paper': '0 2px 8px rgba(33, 33, 33, 0.08)',
        'paper-lg': '0 4px 16px rgba(33, 33, 33, 0.12)',
        'paper-hover': '0 6px 20px rgba(33, 33, 33, 0.15)',
      },
      borderRadius: {
        'organic-sm': '4px 6px 4px 5px',
        'organic': '8px 12px 8px 10px',
        'organic-lg': '12px 16px 10px 14px',
      },
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography')
  ]
}
