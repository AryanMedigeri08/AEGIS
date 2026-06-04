export const theme = {
  colors: {
    // Primary
    primary: '#2962FF', // Electric Blue
    primaryDark: '#0039CB',
    primaryLight: '#768FFF',

    // Semantic
    success: '#22C55E', // Emerald Green
    error: '#EF4444', // Alert Red
    warning: '#F59E0B', // Amber

    // Background (dark mode default)
    background: '#121212',
    surface: '#1E1E1E',
    surfaceElevated: '#2C2C2C',
    surfaceGlass: 'rgba(255,255,255,0.06)', // glassmorphism base

    // Text
    textPrimary: '#FFFFFF',
    textSecondary: '#9AA0A6',
    textDisabled: '#5F6368',
    textInverse: '#121212',

    // UI
    border: '#3C4043',
    borderGlass: 'rgba(255,255,255,0.12)',
    overlay: 'rgba(0,0,0,0.6)',
    divider: '#2C2C2C',
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,
  },

  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },

  typography: {
    display: { fontSize: 32, fontWeight: '700' as const, letterSpacing: -0.5 },
    h1: { fontSize: 24, fontWeight: '700' as const, letterSpacing: -0.3 },
    h2: { fontSize: 20, fontWeight: '600' as const, letterSpacing: -0.2 },
    h3: { fontSize: 16, fontWeight: '600' as const, letterSpacing: 0 },
    body: { fontSize: 14, fontWeight: '400' as const, letterSpacing: 0.1 },
    caption: { fontSize: 12, fontWeight: '400' as const, letterSpacing: 0.2 },
    button: { fontSize: 16, fontWeight: '600' as const, letterSpacing: 0.3 },
    mono: { fontSize: 12, fontWeight: '400' as const, fontFamily: 'monospace' },
  },
};
