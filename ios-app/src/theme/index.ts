/**
 * BuildPaper Design System
 *
 * Shared design tokens inspired by the Red Bull Basement light theme.
 * All screens should import from here instead of hardcoding colours.
 */
import { Platform, Dimensions, TextStyle, ViewStyle } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IS_IOS = Platform.OS === 'ios';

// ─── Colour Palette ──────────────────────────────────────────
export const COLORS = {
  // Backgrounds
  bg: '#F5F5F0',           // warm off-white (primary)
  bgDark: '#0F1923',       // dark mode (PaperToss only)
  cardBg: '#FFFFFF',
  formBg: '#E8EDF4',       // light blue-grey panels
  inputBg: '#FFFFFF',

  // Text
  text: '#1A2332',         // near-black primary
  textSecondary: '#5A6577',
  textMuted: '#8899B0',
  textOnDark: '#F0F4FA',

  // Accents
  accent: '#D93B41',       // primary CTA (red)
  accentLight: '#FDE8E9',
  accentDark: '#B82E33',
  gold: '#FFB547',         // secondary accent (used in game)
  goldLight: '#FFF3CD',

  // Status
  success: '#22C55E',
  successBg: '#DCFCE7',
  successDark: '#16A34A',
  warning: '#F59E0B',
  warningBg: '#FEF9C3',
  warningBorder: '#FDE68A',
  warningDark: '#B45309',
  error: '#EF4444',
  errorBg: '#FEE2E2',

  // Borders / Dividers
  border: '#E0E4EB',
  borderLight: '#EAEDF2',
  borderDark: '#D5DAE2',
  divider: '#F0F0F4',

  // Misc
  skyline: '#C8CDD6',
  overlay: 'rgba(26, 35, 50, 0.55)',
  overlayDark: 'rgba(6, 12, 24, 0.85)',

  // Legacy backwards compatibility
  white: '#FFFFFF',
  black: '#000000',

  // Category badge palette
  category: {
    tech:       '#4F8EF7',
    health:     '#34D399',
    finance:    '#A78BFA',
    social:     '#F472B6',
    education:  '#FB923C',
    other:      '#6EE7B7',
  },

  // Stage badge palette
  stage: {
    idea:      '#FFB547',
    mvp:       '#4F8EF7',
    growth:    '#34D399',
    scale:     '#D93B41',
  },
} as const;

// ─── Typography ──────────────────────────────────────────────
export const FONTS = {
  // Headings
  h1: {
    fontSize: 34,
    fontWeight: '900' as TextStyle['fontWeight'],
    color: COLORS.text,
    letterSpacing: 0.3,
  },
  h2: {
    fontSize: 24,
    fontWeight: '800' as TextStyle['fontWeight'],
    color: COLORS.text,
  },
  h3: {
    fontSize: 20,
    fontWeight: '700' as TextStyle['fontWeight'],
    color: COLORS.text,
  },
  // Body
  body: {
    fontSize: 15,
    fontWeight: '400' as TextStyle['fontWeight'],
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  bodySmall: {
    fontSize: 13,
    fontWeight: '400' as TextStyle['fontWeight'],
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  caption: {
    fontSize: 12,
    fontWeight: '500' as TextStyle['fontWeight'],
    color: COLORS.textMuted,
  },
  // Buttons
  button: {
    fontSize: 16,
    fontWeight: '700' as TextStyle['fontWeight'],
    color: COLORS.white,
  },
  buttonSmall: {
    fontSize: 14,
    fontWeight: '600' as TextStyle['fontWeight'],
    color: COLORS.white,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as TextStyle['fontWeight'],
    color: COLORS.text,
    textTransform: 'uppercase' as TextStyle['textTransform'],
    letterSpacing: 0.8,
  },
};

// ─── Spacing ─────────────────────────────────────────────────
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// ─── Radii ───────────────────────────────────────────────────
export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  pill: 999,
};

// ─── Shadows ────────────────────────────────────────────────
export const SHADOWS = {
  sm: {
    shadowColor: '#1A2332',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  } as ViewStyle,
  md: {
    shadowColor: '#1A2332',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  } as ViewStyle,
  lg: {
    shadowColor: '#1A2332',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 6,
  } as ViewStyle,
};

// ─── Common Style Fragments ──────────────────────────────────
export const COMMON = {
  /** Standard screen container */
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  } as ViewStyle,

  /** Card with white background + shadow */
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  } as ViewStyle,

  /** Elevated hero card (e.g. balance card) */
  heroCard: {
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOWS.lg,
  } as ViewStyle,

  /** Primary CTA button */
  primaryButton: {
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center' as ViewStyle['alignItems'],
    justifyContent: 'center' as ViewStyle['justifyContent'],
  } as ViewStyle,

  /** Secondary / outline button */
  secondaryButton: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingVertical: 12,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center' as ViewStyle['alignItems'],
  } as ViewStyle,

  /** Standard text input */
  input: {
    backgroundColor: COLORS.inputBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.text,
  } as ViewStyle,

  /** Pill badge */
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  } as ViewStyle,

  /** Section header */
  sectionHeader: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  } as ViewStyle,

  /** Standard row container for horizontal layout */
  row: {
    flexDirection: 'row' as ViewStyle['flexDirection'],
    alignItems: 'center' as ViewStyle['alignItems'],
  },

  /** Safe area top padding */
  safeTop: {
    paddingTop: IS_IOS ? 56 : 16,
  } as ViewStyle,
};

export { IS_IOS, SCREEN_WIDTH };
