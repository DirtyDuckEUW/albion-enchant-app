/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'cp-rosewater': '#f5e0dc',
        'cp-flamingo': '#f2cdcd',
        'cp-pink': '#f5c2e7',
        'cp-mauve': '#cba6f7',
        'cp-red': '#f38ba8',
        'cp-maroon': '#eba0ac',
        'cp-peach': '#fab387',
        'cp-yellow': '#f9e2af',
        'cp-green': '#a6e3a1',
        'cp-teal': '#94e2d5',
        'cp-sky': '#89dceb',
        'cp-sapphire': '#74c7ec',
        'cp-blue': '#89b4fa',
        'cp-lavender': '#b4befe',

        /* semantic colors */
        'cp-text': '#cdd6f4',
        'cp-subtext0': '#a6adc8',
        'cp-subtext1': '#bac2de',
        'cp-overlay0': '#6c7086',
        'cp-overlay1': '#7f849c',
        'cp-overlay2': '#9399b2',
        'cp-surface0': '#313244',
        'cp-surface1': '#45475a',
        'cp-surface2': '#585b70',
        'cp-base': '#1f1d2e',
        'cp-mantle': '#191724',
        'cp-crust': '#11111b',

        /* mapped semantic names for convenience */
        'cp-background': '#1f1d2e',
        'cp-panel': '#313244',
        'cp-foreground': '#cdd6f4',
        'cp-muted': '#a6adc8',
        'cp-accent': '#89b4fa',
        'cp-primary': '#cba6f7',
      },
    },
  },
  plugins: [],
};
