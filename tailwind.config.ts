import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        basque: {
          red: '#D32F2F',
          'red-dark': '#B71C1C',
          green: '#2E7D32',
          'green-dark': '#1B5E20',
          white: '#FFFFFF',
        },
      },
    },
  },
  plugins: [],
}
export default config
