export { palette, lightColors, darkColors } from './colors';
export { typography, fontFamily } from './typography';
export { spacing, borderRadius, layout } from './spacing';
export { shadows } from './shadows';
export { ThemeProvider, useTheme } from './ThemeContext';

export const getStatusColor = (colors, status) => {
  const map = {
    pending: colors.statusPending,
    accepted: colors.statusAccepted,
    preparing: colors.statusPreparing,
    ready: colors.statusReady,
    picked: colors.statusPicked,
    delivered: colors.statusDelivered,
    cancelled: colors.statusCancelled,
    online: colors.statusDelivered,
    offline: colors.textTertiary,
  };
  return map[status] || colors.textTertiary;
};
