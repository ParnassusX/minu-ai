/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
  	container: {
  		center: true,
  		padding: {
  			DEFAULT: '1rem',
  			sm: '1rem',
  			lg: '1.5rem',
  			xl: '2rem',
  			'2xl': '2rem',
  		},
  		screens: {
  			sm: '100%',
  			md: '100%',
  			lg: '100%',
  			xl: '100%',
  			'2xl': '100%'
  		}
  	},
  	extend: {
  		screens: {
  			// Standardized breakpoints for Minu.AI
  			'mobile': '375px',   // Mobile breakpoint
  			'tablet': '768px',   // Tablet breakpoint
  			'desktop': '1920px', // Desktop breakpoint
  			'3xl': '1440px',     // Ultra-wide breakpoint for intelligent distribution
  		},
  		colors: {
  			// Legacy shadcn/ui colors (maintained for compatibility)
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',

  			// Enhanced Primary Colors (CSS Custom Properties)
  			primary: {
  				50: 'var(--color-primary-50)',
  				100: 'var(--color-primary-100)',
  				200: 'var(--color-primary-200)',
  				300: 'var(--color-primary-300)',
  				400: 'var(--color-primary-400)',
  				500: 'var(--color-primary-500)',
  				600: 'var(--color-primary-600)',
  				700: 'var(--color-primary-700)',
  				800: 'var(--color-primary-800)',
  				900: 'var(--color-primary-900)',
  				950: 'var(--color-primary-950)',
  				DEFAULT: 'var(--interactive-primary)',
  				foreground: 'hsl(var(--primary-foreground))'
  			},

  			// Modern Neutral System
  			neutral: {
  				0: 'var(--color-neutral-0)',
  				50: 'var(--color-neutral-50)',
  				100: 'var(--color-neutral-100)',
  				200: 'var(--color-neutral-200)',
  				300: 'var(--color-neutral-300)',
  				400: 'var(--color-neutral-400)',
  				500: 'var(--color-neutral-500)',
  				600: 'var(--color-neutral-600)',
  				700: 'var(--color-neutral-700)',
  				800: 'var(--color-neutral-800)',
  				900: 'var(--color-neutral-900)',
  				950: 'var(--color-neutral-950)',
  			},

  			// Semantic Colors
  			success: {
  				500: 'var(--color-success-500)',
  				600: 'var(--color-success-600)',
  			},
  			warning: {
  				500: 'var(--color-warning-500)',
  				600: 'var(--color-warning-600)',
  			},
  			error: {
  				500: 'var(--color-error-500)',
  				600: 'var(--color-error-600)',
  			},

  			// Surface & Background System
  			'bg-primary': 'var(--bg-primary)',
  			'bg-secondary': 'var(--bg-secondary)',
  			'bg-tertiary': 'var(--bg-tertiary)',
  			'bg-elevated': 'var(--bg-elevated)',
  			'bg-overlay': 'var(--bg-overlay)',

  			// Glass Morphism
  			'surface-glass': 'var(--surface-glass)',
  			'surface-glass-hover': 'var(--surface-glass-hover)',
  			'surface-glass-active': 'var(--surface-glass-active)',
  			'surface-border': 'var(--surface-border)',
  			'surface-border-hover': 'var(--surface-border-hover)',

  			// Text Colors
  			'text-primary': 'var(--text-primary)',
  			'text-secondary': 'var(--text-secondary)',
  			'text-tertiary': 'var(--text-tertiary)',
  			'text-muted': 'var(--text-muted)',
  			'text-inverse': 'var(--text-inverse)',

  			// Interactive Colors
  			'interactive-primary': 'var(--interactive-primary)',
  			'interactive-primary-hover': 'var(--interactive-primary-hover)',
  			'interactive-primary-active': 'var(--interactive-primary-active)',
  			'interactive-secondary': 'var(--interactive-secondary)',
  			'interactive-secondary-hover': 'var(--interactive-secondary-hover)',
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
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		borderRadius: {
  			// Legacy shadcn/ui radius
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)',

  			// Modern Design System Radius
  			none: 'var(--radius-none)',
  			'radius-sm': 'var(--radius-sm)',
  			'radius-base': 'var(--radius-base)',
  			'radius-md': 'var(--radius-md)',
  			'radius-lg': 'var(--radius-lg)',
  			'radius-xl': 'var(--radius-xl)',
  			'radius-full': 'var(--radius-full)',
  		},

  		spacing: {
  			// Enhanced spacing system based on design tokens
  			'space-0': 'var(--space-0)',
  			'space-1': 'var(--space-1)',
  			'space-2': 'var(--space-2)',
  			'space-3': 'var(--space-3)',
  			'space-4': 'var(--space-4)',
  			'space-5': 'var(--space-5)',
  			'space-6': 'var(--space-6)',
  			'space-8': 'var(--space-8)',
  			'space-10': 'var(--space-10)',
  			'space-12': 'var(--space-12)',
  			'space-16': 'var(--space-16)',
  			'space-20': 'var(--space-20)',
  			'space-24': 'var(--space-24)',
  		},

  		fontSize: {
  			// Modern typography scale
  			'text-xs': 'var(--text-xs)',
  			'text-sm': 'var(--text-sm)',
  			'text-base': 'var(--text-base)',
  			'text-lg': 'var(--text-lg)',
  			'text-xl': 'var(--text-xl)',
  			'text-2xl': 'var(--text-2xl)',
  			'text-3xl': 'var(--text-3xl)',
  			'text-4xl': 'var(--text-4xl)',
  			'text-5xl': 'var(--text-5xl)',
  		},

  		fontFamily: {
  			sans: 'var(--font-sans)',
  			mono: 'var(--font-mono)',
  		},

  		fontWeight: {
  			light: 'var(--font-weight-light)',
  			normal: 'var(--font-weight-normal)',
  			medium: 'var(--font-weight-medium)',
  			semibold: 'var(--font-weight-semibold)',
  			bold: 'var(--font-weight-bold)',
  		},

  		boxShadow: {
  			// Enhanced shadow system
  			'shadow-sm': 'var(--shadow-sm)',
  			'shadow-base': 'var(--shadow-base)',
  			'shadow-md': 'var(--shadow-md)',
  			'shadow-lg': 'var(--shadow-lg)',
  			'shadow-xl': 'var(--shadow-xl)',
  			'shadow-2xl': 'var(--shadow-2xl)',
  			'shadow-glass': 'var(--shadow-glass)',
  			'shadow-glass-lg': 'var(--shadow-glass-lg)',
  		},

  		transitionTimingFunction: {
  			'ease-in-out': 'var(--ease-in-out)',
  			'ease-out': 'var(--ease-out)',
  			'ease-in': 'var(--ease-in)',
  			'ease-bounce': 'var(--ease-bounce)',
  		},

  		transitionDuration: {
  			fast: 'var(--duration-fast)',
  			normal: 'var(--duration-normal)',
  			slow: 'var(--duration-slow)',
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: 0
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
  					height: 0
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
