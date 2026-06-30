import { StyleSheet, Platform } from 'react-native';

export const screenContainer = (colors) => ({
  flex: 1,
  backgroundColor: colors.background,
});

export const centeredContainer = (colors) => ({
  flex: 1,
  backgroundColor: colors.background,
  justifyContent: 'center',
  alignItems: 'center',
});

export const card = (colors, shadows) => ({
  backgroundColor: colors.cardBackground,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: colors.cardBorder,
  padding: 16,
  ...shadows.card,
});

export const headerBar = (colors, spacing) => ({
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingHorizontal: spacing.lg,
  paddingVertical: spacing.md,
  backgroundColor: colors.background,
  minHeight: 56,
});

export const tabBar = (colors) => ({
  backgroundColor: colors.tabBackground,
  borderTopWidth: 1,
  borderTopColor: colors.tabBorder,
  paddingBottom: 5,
  paddingTop: 5,
  height: 60,
});

export const badge = (colors) => ({
  backgroundColor: colors.error,
  borderRadius: 10,
  minWidth: 20,
  height: 20,
  justifyContent: 'center',
  alignItems: 'center',
  paddingHorizontal: 6,
});

export const badgeText = (typography) => ({
  ...typography.captionBold,
  color: '#FFFFFF',
  fontSize: 10,
});

export const input = (colors, spacing) => ({
  backgroundColor: colors.inputBackground,
  borderWidth: 1,
  borderColor: colors.inputBorder,
  borderRadius: 12,
  paddingHorizontal: spacing.lg,
  paddingVertical: spacing.md,
  fontSize: 16,
  color: colors.inputText,
  minHeight: 48,
});

export const button = (colors, spacing) => ({
  primary: {
    backgroundColor: colors.buttonPrimary,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  secondary: {
    backgroundColor: colors.buttonSecondary,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  disabled: {
    backgroundColor: colors.buttonDisabled,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
});

export const buttonText = (typography, colors) => ({
  primary: {
    ...typography.button,
    color: colors.buttonPrimaryText,
  },
  secondary: {
    ...typography.button,
    color: colors.buttonSecondaryText,
  },
  disabled: {
    ...typography.button,
    color: colors.buttonDisabledText,
  },
});

export const listItem = (colors, spacing) => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
});

export const divider = (colors) => ({
  height: 1,
  backgroundColor: colors.divider,
});

export const shadow = (colors) => ({
  color: colors.shadow,
  offset: { width: 0, height: 2 },
  opacity: 0.15,
  radius: 4,
  elevation: 3,
});

export const overlay = (colors) => ({
  ...StyleSheet.absoluteFillObject,
  backgroundColor: colors.overlay,
});

export const row = (spacing) => ({
  flexDirection: 'row',
  alignItems: 'center',
});

export const chip = (colors, typography) => ({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.surfaceVariant,
    borderWidth: 1,
    borderColor: colors.border,
  },
  text: {
    ...typography.captionBold,
    color: colors.textPrimary,
  },
  active: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  activeText: {
    color: colors.textInverse,
  },
});

export const priceTag = (typography, colors) => ({
  ...typography.price,
  color: colors.textPrimary,
});

export const avatar = (colors) => ({
  small: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceVariant,
  },
  medium: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceVariant,
  },
  large: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surfaceVariant,
  },
});
