export const palette = {
  black: '#000000',
  white: '#FFFFFF',

  gray50: '#F8F9FA',
  gray100: '#E9ECEF',
  gray200: '#DEE2E6',
  gray300: '#CED4DA',
  gray400: '#ADB5BD',
  gray500: '#6C757D',
  gray600: '#666666',
  gray700: '#495057',
  gray800: '#333333',
  gray900: '#1A1A1A',
  gray950: '#0D0D0D',

  silver: '#C0C0C0',
  silverLight: '#E0E0E0',
  silverDark: '#8E8E93',

  blue: '#0A84FF',
  green: '#34C759',
  red: '#FF3B30',
  orange: '#FF9F0A',
  yellow: '#FFD60A',
  teal: '#30B0C7',

  overlay: 'rgba(0, 0, 0, 0.6)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
};

export const lightColors = {
  background: palette.gray50,
  surface: palette.white,
  surfaceVariant: palette.gray100,
  surfaceDisabled: palette.gray200,

  textPrimary: palette.gray800,
  textSecondary: palette.gray500,
  textTertiary: palette.gray600,
  textInverse: palette.white,

  accent: palette.teal,
  accentLight: '#A8DADC',
  accentDark: '#1D8A99',
  accentSurface: '#FFF3E0',

  dangerSurface: '#FFE5E5',
  dangerBorder: '#FED7D7',

  successSurface: '#E8F5E9',

  border: palette.gray100,
  divider: palette.gray200,

  success: palette.green,
  error: palette.red,
  warning: palette.orange,
  info: palette.blue,

  shadow: palette.black,
  overlay: palette.overlay,

  // Tab bar
  tabActive: palette.teal,
  tabInactive: palette.gray500,
  tabBackground: palette.white,
  tabBorder: palette.gray100,

  // Status bar
  statusBar: palette.white,
  statusBarStyle: 'dark-content',

  // Input
  inputBackground: palette.white,
  inputBorder: palette.gray200,
  inputPlaceholder: palette.gray500,
  inputText: palette.gray800,

  // Button
  buttonPrimary: palette.teal,
  buttonPrimaryText: palette.white,
  buttonSecondary: palette.gray100,
  buttonSecondaryText: palette.gray800,
  buttonDisabled: palette.gray200,
  buttonDisabledText: palette.gray500,

  // Card
  cardBackground: palette.white,
  cardBorder: palette.gray100,

  // Order status badges — balanced for AMOLED
  statusPending: '#E5A100',
  statusAccepted: '#6B9FD4',
  statusPreparing: '#A0A0A0',
  statusReady: '#5AABB8',
  statusPicked: '#7B79C2',
  statusDelivered: '#5CB868',
  statusCancelled: '#D94F44',
};

export const darkColors = {
  background: palette.black,
  surface: palette.gray900,
  surfaceVariant: palette.gray950,
  surfaceDisabled: palette.gray800,

  textPrimary: palette.white,
  textSecondary: palette.silverDark,
  textTertiary: palette.gray500,
  textInverse: palette.black,

  accent: palette.silver,
  accentLight: palette.gray400,
  accentDark: palette.silverLight,
  accentSurface: '#2C2C2E',

  dangerSurface: '#3A1A1A',
  dangerBorder: '#4A2020',

  successSurface: '#1A2E1A',

  border: palette.gray950,
  divider: '#2C2C2E',

  success: palette.green,
  error: palette.red,
  warning: palette.orange,
  info: palette.blue,

  shadow: palette.black,
  overlay: palette.overlay,

  // Tab bar
  tabActive: palette.silver,
  tabInactive: palette.gray500,
  tabBackground: palette.black,
  tabBorder: '#2C2C2E',

  // Status bar
  statusBar: palette.black,
  statusBarStyle: 'light-content',

  // Input
  inputBackground: palette.gray900,
  inputBorder: '#2C2C2E',
  inputPlaceholder: palette.gray500,
  inputText: palette.white,

  // Button
  buttonPrimary: palette.silver,
  buttonPrimaryText: palette.black,
  buttonSecondary: '#2C2C2E',
  buttonSecondaryText: palette.silverLight,
  buttonDisabled: palette.gray800,
  buttonDisabledText: palette.gray500,

  // Card
  cardBackground: palette.gray900,
  cardBorder: '#2C2C2E',

  // Order status badges — balanced for AMOLED
  statusPending: '#E5A100',
  statusAccepted: '#6B9FD4',
  statusPreparing: '#A0A0A0',
  statusReady: '#5AABB8',
  statusPicked: '#7B79C2',
  statusDelivered: '#5CB868',
  statusCancelled: '#D94F44',
};
