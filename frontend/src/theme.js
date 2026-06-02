export const colors = {
  // Backgrounds
  bgPrimary:     '#F7F8FA',
  bgSurface:     '#FFFFFF',
  bgElevated:    '#F0F2F7',
  bgAmber:       '#FEF3C7',
  bgNavy:        '#EFF2FF',

  // Borders
  border:        '#E4E7EE',
  borderStrong:  '#CBD3DF',

  // Brand — FINANCIAL PALETTE
  navy:          '#0C1628',    // primary headlines, strong text
  navyMid:       '#1E2B3A',    // secondary dark
  navyLight:     '#1E3A8A',    // buttons, interactive links

  // KEY CHANGE: amber/gold replaces blue as ACCENT
  amber:         '#C8922A',    // financial accent — used for KEY DATA
  amberLight:    '#D4A843',
  amberBg:       '#FEF3C7',
  amberBorder:   '#FCD34D',

  // Sentiment — unchanged, these are correct
  positive:      '#059669',
  positiveBg:    '#ECFDF5',
  positiveBorder:'#A7F3D0',
  negative:      '#DC2626',
  negativeBg:    '#FEF2F2',
  negativeBorder:'#FECACA',
  warning:       '#D97706',
  warningBg:     '#FFFBEB',
  neutral:       '#6B7280',
  neutralBg:     '#F9FAFB',
  neutralBorder: '#E5E7EB',

  // Text
  textPrimary:   '#0C1628',
  textSecondary: '#374151',
  textMuted:     '#6B7280',
  textTertiary:  '#9CA3AF',

  // Heatmap (Vivid palette)
  heatHigh:     { bg: '#86EFAC', text: '#14532D', border: '#4ADE80' },
  heatMidHigh:  { bg: '#BBF7D0', text: '#166534', border: '#86EFAC' },
  heatMid:      { bg: '#FDE68A', text: '#78350F', border: '#FCD34D' },
  heatLow:      { bg: '#FCA5A5', text: '#7F1D1D', border: '#F87171' },
  heatBearish:  { bg: '#F87171', text: '#450A0A', border: '#EF4444' },
  heatEmpty:    { bg: '#F1F5F9', text: '#9CA3AF', border: '#E2E8F0' },
}

export const fonts = {
  body: "'Inter', sans-serif",
  mono: "'Space Mono', monospace",
};

export const radius = {
  sm: "4px",
  md: "8px",
  lg: "12px",
  xl: "16px",
  pill: "9999px",
};

export const theme = { colors, fonts, radius };
