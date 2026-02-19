/**
 * BuildPaper Design System v2
 *
 * Dark, vibrant game-inspired theme.
 * Draws from Duolingo (3D buttons, bold typography),
 * Clash Royale (card depth, rarity colours),
 * and Apple HIG (spacing, hierarchy).
 *
 * All screens must import from here — never hardcode colours.
 */
import { Platform, Dimensions, TextStyle, ViewStyle } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IS_IOS = Platform.OS === 'ios';

// ─── Colour Palette ──────────────────────────────────────────
export const COLORS = {
  // Backgrounds – deep navy layering
  bg:          '#0F0F1A',      // primary background
  bgSecondary: '#1A1A2E',      // card / surface
  bgTertiary:  '#25253D',      // elevated surface
  cardBg:      '#1A1A2E',
  formBg:      '#25253D',
  inputBg:     '#2A2A44',

  // Text
  text:          '#FFFFFF',
  textSecondary: '#B8B8D0',
  textMuted:     '#6C6C80',
  textOnDark:    '#F0F4FA',

  // Primary – rich purple
  accent:      '#6C5CE7',
  accentLight: 'rgba(108, 92, 231, 0.15)',
  accentDark:  '#4A3DB5',

  // Secondary – warm gold
  gold:        '#FDCB6E',
  goldLight:   'rgba(253, 203, 110, 0.15)',
  goldDark:    '#E17055',

  // Game colours
  xp:          '#00D2D3',      // cyan for XP / energy
  health:      '#FF6B6B',      // red for warnings
  coins:       '#FECA57',      // yellow for coins

  // Status
  success:      '#00B894',
  successBg:    'rgba(0, 184, 148, 0.12)',
  successDark:  '#00A381',
  warning:      '#FDCB6E',
  warningBg:    'rgba(253, 203, 110, 0.12)',
  warningBorder:'rgba(253, 203, 110, 0.3)',
  warningDark:  '#E17055',
  error:        '#FF6B6B',
  errorBg:      'rgba(255, 107, 107, 0.12)',

  // Borders / Dividers
  border:      'rgba(255, 255, 255, 0.08)',
  borderLight: 'rgba(255, 255, 255, 0.05)',
  borderDark:  'rgba(255, 255, 255, 0.12)',
  divider:     'rgba(255, 255, 255, 0.06)',

  // Misc
  overlay:     'rgba(15, 15, 26, 0.75)',
  overlayDark: 'rgba(15, 15, 26, 0.92)',

  // Legacy backward compat
  white: '#FFFFFF',
  black: '#000000',

  // Category badge palette
  category: {
    tech:       '#4F8EF7',
    health:     '#00B894',
    finance:    '#A29BFE',
    social:     '#FD79A8',
    education:  '#E17055',
    other:      '#00D2D3',
  },

  // Stage badge palette
  stage: {
    idea:   '#FDCB6E',
    mvp:    '#4F8EF7',
    growth: '#00B894',
    scale:  '#FF6B6B',
  },

  // Rarity
  rarity: {
    common:    '#636E72',
    rare:      '#6C5CE7',
    epic:      '#E17055',
    legendary: '#FDCB6E',
  },
} as const;

// ─── Typography ──────────────────────────────────────────────
export const FONTS = {
  // Headings
  h1: {
    fontSize: 32,
    fontWeight: '900' as TextStyle['fontWeight'],
    color: COLORS.text,
    letterSpacing: -0.5,
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
    fontSize: 16,
    fontWeight: '400' as TextStyle['fontWeight'],
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as TextStyle['fontWeight'],
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '500' as TextStyle['fontWeight'],
    color: COLORS.textMuted,
  },
  // Stat numbers (XP, coins, levels)
  stat: {
    fontSize: 28,
    fontWeight: '900' as TextStyle['fontWeight'],
    color: COLORS.text,
  },
  // Buttons
  button: {
    fontSize: 17,
    fontWeight: '700' as TextStyle['fontWeight'],
    color: COLORS.white,
  },
  buttonSmall: {
    fontSize: 14,
    fontWeight: '600' as TextStyle['fontWeight'],
    color: COLORS.white,
  },
  label: {
    fontSize: 12,
    fontWeight: '700' as TextStyle['fontWeight'],
    color: COLORS.textMuted,
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

// ─── Shadows (for dark backgrounds, glow-style shadows) ─────
export const SHADOWS = {
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  } as ViewStyle,
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  } as ViewStyle,
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  } as ViewStyle,
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  } as ViewStyle),
};

// ─── Common Style Fragments ──────────────────────────────────
export const COMMON = {
  /** Standard screen container */
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  } as ViewStyle,

  /** Card with dark background + subtle border */
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  } as ViewStyle,

  /** Elevated hero card (balance, featured) */
  heroCard: {
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOWS.lg,
  } as ViewStyle,

  /** Primary CTA button – Duolingo-style with 3D bottom */
  primaryButton: {
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.md,
    paddingVertical: 16,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center' as ViewStyle['alignItems'],
    justifyContent: 'center' as ViewStyle['justifyContent'],
    borderBottomWidth: 4,
    borderBottomColor: COLORS.accentDark,
  } as ViewStyle,

  /** Secondary / outline button */
  secondaryButton: {
    backgroundColor: COLORS.bgTertiary,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    paddingVertical: 14,
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
  } as ViewStyle,

  /** Section header */
  sectionHeader: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  } as ViewStyle,

  /** Standard row container */
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
