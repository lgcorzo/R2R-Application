/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './@/components/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: '',
  theme: {
    container: {
      center: 'true',
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      fontSize: {
        // Размеры шрифта как в IDE (Cursor/VS Code)
        xs: ['12px', { lineHeight: '1.5' }], // Мелкий текст (12px)
        sm: ['13px', { lineHeight: '1.5' }], // Основной текст (13px)
        base: ['13px', { lineHeight: '1.5' }], // Базовый (13px)
        lg: ['14px', { lineHeight: '1.5' }], // Заголовки (14px)
        xl: ['16px', { lineHeight: '1.5' }],
        '2xl': ['18px', { lineHeight: '1.4' }],
        '3xl': ['20px', { lineHeight: '1.3' }],
      },
      fontFamily: {
        // Моноширинный шрифт для кода и данных
        mono: [
          'SF Mono',
          'Monaco',
          'Cascadia Code',
          'Consolas',
          'Fira Code',
          'JetBrains Mono',
          'Courier New',
          'monospace',
        ],
        // Системный шрифт для UI элементов
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Oxygen',
          'Ubuntu',
          'Cantarell',
          'Fira Sans',
          'Droid Sans',
          'Helvetica Neue',
          'sans-serif',
        ],
      },
      colors: {
        accent: {
          base: 'var(--accent-base)',
          light: 'var(--accent-light)',
          lighter: 'var(--accent-lighter)',
          dark: 'var(--accent-dark)',
          darker: 'var(--accent-darker)',
          contrast: 'var(--accent-contrast)',
        },
        color1: 'var(--color-1)',
        color2: 'var(--color-2)',
        color3: 'var(--color-3)',
        color4: 'var(--color-4)',
        color5: 'var(--color-5)',
        color6: 'var(--color-6)',
        color7: 'var(--color-7)',
        color8: 'var(--color-8)',
        color9: 'var(--color-9)',
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        info: {
          DEFAULT: 'hsl(var(--info))',
          foreground: 'hsl(var(--info-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        link: 'var(--link)',
        'link-hover': 'var(--link-hover)',
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
      },
      backgroundColor: {
        'primary-custom': 'var(--sciphi-primary)',
        'secondary-custom': 'var(--sciphi-secondary)',
        'accent-custom': 'var(--sciphi-accent)',
      },
      textColor: {
        link: 'var(--link)',
        'link-hover': 'var(--link-hover)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
      boxShadow: {
        header: 'var(--header-box-shadow)',
        shadow: 'var(--shadow)',
        'shadow-hover': 'var(--shadow-hover)',
      },
    },
  },
  plugins: [require('tailwindcss-animate'), require('@tailwindcss/forms')],
};
