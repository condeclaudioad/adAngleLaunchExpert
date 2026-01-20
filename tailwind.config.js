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
                'bg-primary': 'var(--bg-primary)',
                'bg-secondary': 'var(--bg-secondary)',
                'bg-tertiary': 'var(--bg-tertiary)',
                'bg-elevated': 'var(--bg-elevated)',

                // Accents
                'accent-primary': 'var(--accent-primary)',
                'accent-secondary': 'var(--accent-secondary)',

                // Text - We map these to standard tailwind utilities or custom
                'text-primary': 'var(--text-primary)',
                'text-secondary': 'var(--text-secondary)',
                'text-muted': 'var(--text-muted)',

                // Borders
                'border-subtle': 'var(--border-subtle)',
                'border-default': 'var(--border-default)',
                'border-hover': 'var(--border-hover)',
                'border-accent': 'var(--border-accent)',
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
