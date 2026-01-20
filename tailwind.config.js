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
                // Backgrounds
                'bg-primary': 'rgb(var(--bg-primary) / <alpha-value>)',
                'bg-secondary': 'rgb(var(--bg-secondary) / <alpha-value>)',
                'bg-tertiary': 'rgb(var(--bg-tertiary) / <alpha-value>)',
                'bg-elevated': 'rgb(var(--bg-elevated) / <alpha-value>)',

                // Accents
                'accent-primary': 'rgb(var(--accent-primary) / <alpha-value>)',
                'accent-secondary': 'rgb(var(--accent-secondary) / <alpha-value>)',

                // Text
                'text-primary': 'rgb(var(--text-primary) / <alpha-value>)',
                'text-secondary': 'rgb(var(--text-secondary) / <alpha-value>)',
                'text-muted': 'rgb(var(--text-muted) / <alpha-value>)',

                // Borders - Use direct vars to preserve default opacity
                'border-subtle': 'var(--border-subtle)',
                'border-default': 'var(--border-default)',
                'border-hover': 'var(--border-hover)',
                'border-accent': 'rgb(var(--border-accent) / <alpha-value>)',
            },
            boxShadow: {
                'glow-orange': 'var(--glow-orange)',
                'glow-soft': 'var(--glow-soft)',
            },
            fontFamily: {
                sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
            },
            borderRadius: {
                'sm': 'var(--radius-sm)',
                'md': 'var(--radius-md)',
                'lg': 'var(--radius-lg)',
                'xl': 'var(--radius-xl)',
                '2xl': 'var(--radius-2xl)',
            }
        },
    },
    plugins: [],
}
