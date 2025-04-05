
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				'baybayin': ['Baybayin Modern', 'sans-serif'],
				'sans': ['Inter', 'system-ui', 'sans-serif'],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
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
				},
				kusina: {
					'green': '#5A8C0F',     // Green from image: #5A8C0F
					'light-green': '#D1FFB5', // Light green for accents
					'fresh-green': '#A0E57C', // Fresh green for highlights
					'orange': '#F28907',    // Orange from image: #F28907
					'red': '#D90404',       // Red from image: #D90404
					'maroon': '#590202',    // Deep red/maroon from image: #590202
					'cream': '#F2F2F2',     // Light cream/white from image: #F2F2F2
					'brown': '#8B4513',     // Keep the existing brown
					'light': '#FDF5E6',     // Keep the existing light
					'gold': '#DAA520',      // Keep the existing gold
					'purple': '#800080',    // Keep the existing purple
					'teal': '#008080',      // Keep the existing teal
					'magenta': '#C71585',   // Keep the existing magenta
					'yellow': '#FFD700',    // Keep the existing yellow
					'blue': '#1E90FF'       // Keep the existing blue
				}
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
				'pulse-slow': {
					'0%, 100%': { opacity: '1' },
					'50%': { opacity: '0.5' }
				},
				'float': {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-10px)' }
				},
				'shimmer': {
					'0%': { backgroundPosition: '-1000px 0' },
					'100%': { backgroundPosition: '1000px 0' }
				},
				'leaf-sway': {
					'0%': { transform: 'rotate(0deg)' },
					'25%': { transform: 'rotate(1deg)' },
					'50%': { transform: 'rotate(0deg)' },
					'75%': { transform: 'rotate(-1deg)' },
					'100%': { transform: 'rotate(0deg)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'pulse-slow': 'pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
				'float': 'float 5s ease-in-out infinite',
				'shimmer': 'shimmer 3s linear infinite',
				'leaf-sway': 'leaf-sway 5s ease-in-out infinite'
			},
			backgroundImage: {
				'festive-gradient': 'linear-gradient(to right, #FF7F50, #DAA520, #B22222)',
				'parol-pattern': "url(\"data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23FFD700' fill-opacity='0.2'%3E%3Cpath d='M0 0h20L10 10zm10 10L0 20h20z'/%3E%3C/g%3E%3C/svg%3E\")",
				'tropical-gradient': 'linear-gradient(to right, #5A8C0F, #A0E57C)', 
				'green-pattern': "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M54.627 0l.83.828-1.415 1.415L51.8 0h2.827zM5.373 0l-.83.828L5.96 2.243 8.2 0H5.374zM48.97 0l3.657 3.657-1.414 1.414L46.143 0h2.828zM11.03 0L7.372 3.657 8.787 5.07 13.857 0H11.03zm32.284 0L49.8 6.485 48.384 7.9l-7.9-7.9h2.83zm-24.596 0l-7.486 7.485 1.415 1.414 7.9-7.9h-1.83zm16.882 0L41.456 6.56l1.414 1.415L36.4 0h-1.03zm-9.172 0L18.566 7.9l1.415 1.415L30 0h-3.592zM0 5.542l.94-1.414L6.486 10l-6.486 6.486.94-1.414L5.544 10 0 5.542zM60 4.128L55.872 0h-2.827l6.955 6.955 1.414-1.414L60 4.128zm0 7.742L48.128 0h-2.827l14.7 14.7 1.414-1.414L60 11.87zm0 7.74L56.243 0h-2.83l14.7 14.7 1.414-1.414L60 19.61zm0 7.745L64.486 0h-2.83L60 8.03v.03L47.97 20.058l1.415 1.415L60 11.87v-.03l1.414-1.414L60 9.013v-.03l1.414-1.414L60 6.156v-.03l1.414-1.414L60 3.297v-.03l1.414-1.414L60 .448v7.742z' fill='%235A8C0F' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E\")"
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
