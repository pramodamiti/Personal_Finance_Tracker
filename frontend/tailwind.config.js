export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      screens: {
        xs: '390px',
        '3xl': '1920px',
        '4xl': '2560px'
      },
      colors: {
        primary: '#1E3A8A',
        accent: '#10B981',
        income: '#16A34A',
        expense: '#DC2626',
        success: '#16A34A',
        warning: '#F59E0B',
        danger: '#DC2626',
        surface: '#ffffff',
        canvas: '#f8fafc'
      },
      fontFamily: {
        sans: ['Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        fintech: '0 24px 60px rgba(15, 23, 42, 0.16)'
      },
      backgroundImage: {
        'fintech-mesh':
          'radial-gradient(circle at top left, rgba(30,58,138,0.14), transparent 28%), radial-gradient(circle at bottom right, rgba(16,185,129,0.12), transparent 28%)'
      }
    }
  },
  plugins: []
};
