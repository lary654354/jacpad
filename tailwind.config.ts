import type { Config } from "tailwindcss";

export default {
    darkMode: ["class"],
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			background: 'var(--background)',
  			foreground: 'var(--foreground)',
  			'jac-green': {
  				DEFAULT: '#39ff14',
  				50: '#f0fff0',
  				100: '#d9ffd4',
  				200: '#b3ffab',
  				300: '#7aff66',
  				400: '#4dff33',
  				500: '#39ff14',
  				600: '#22cc0a',
  				700: '#1a9908',
  				800: '#147306',
  				900: '#0f5c05',
  			},
  			'neon-green': {
  				50: '#f0fff4',
  				100: '#dcfce7',
  				200: '#bbf7d0',
  				300: '#86efac',
  				400: '#4ade80',
  				500: '#39ff14',
  				600: '#16a34a',
  				700: '#15803d',
  				800: '#166534',
  				900: '#14532d',
  				950: '#052e16',
			},
			'neon-red': {
				50: '#fef2f2',
				100: '#fee2e2',
				200: '#fecaca',
				300: '#fca5a5',
				400: '#f87171',
				500: '#ef4444',
				600: '#dc2626',
				700: '#b91c1c',
				800: '#991b1b',
				900: '#7f1d1d',
				950: '#450a0a',
			},
			'crypto-dark': {
				50: '#f8fafc',
				100: '#f1f5f9',
				200: '#e2e8f0',
				300: '#cbd5e1',
				400: '#94a3b8',
				500: '#64748b',
				600: '#475569',
				700: '#334155',
				800: '#1e293b',
				900: '#0f172a',
				950: '#020617',
			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		boxShadow: {
  			'neon-green': '0 0 24px rgba(57, 255, 20, 0.35)',
  			'neon-red': '0 0 20px rgba(239, 68, 68, 0.3)',
  			'neon-blue': '0 0 20px rgba(59, 130, 246, 0.3)',
  			'glow': '0 0 30px rgba(57, 255, 20, 0.15)',
  		},
  		fontFamily: {
  			'sans': ['Segoe UI', 'Helvetica Neue', 'system-ui', 'sans-serif'],
  			'mono': ['JetBrains Mono', 'Fira Code', 'monospace'],
  		},
  		backdropBlur: {
  			'xs': '2px',
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			},
  			'pulse-neon': {
  				'0%, 100%': {
  					boxShadow: '0 0 20px rgba(34, 197, 94, 0.3)',
  				},
  				'50%': {
  					boxShadow: '0 0 30px rgba(34, 197, 94, 0.6)',
  				}
  			},
  			'glow': {
  				'0%, 100%': {
  					textShadow: '0 0 10px rgba(255, 255, 255, 0.5)',
  				},
  				'50%': {
  					textShadow: '0 0 20px rgba(255, 255, 255, 0.8)',
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'pulse-neon': 'pulse-neon 2s ease-in-out infinite',
  			'glow': 'glow 2s ease-in-out infinite',
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
