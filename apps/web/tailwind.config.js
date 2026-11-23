/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        canvas: 'var(--bg-canvas)',
        surface: 'var(--bg-surface)',
        elevated: 'var(--bg-elevated)',
        subtle: 'var(--bg-subtle)',
        border: {
          DEFAULT: 'var(--border-subtle)',
          strong: 'var(--border-strong)',
        },
        content: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
        brand: {
          DEFAULT: 'var(--brand-primary)',
          hover: 'var(--brand-hover)',
          subtle: 'var(--brand-subtle)',
        },
        sentiment: {
          pos: 'var(--sentiment-pos)',
          'pos-bg': 'var(--sentiment-pos-bg)',
          neu: 'var(--sentiment-neu)',
          'neu-bg': 'var(--sentiment-neu-bg)',
          neg: 'var(--sentiment-neg)',
          'neg-bg': 'var(--sentiment-neg-bg)',
        },
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        elevated: 'var(--shadow-elevated)',
      },
    },
  },
  plugins: [],
};
