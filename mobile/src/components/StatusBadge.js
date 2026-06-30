import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme, getStatusColor } from '../theme';

const StatusBadge = ({ status, size = 'default' }) => {
  const { colors, typography } = useTheme();
  const color = getStatusColor(colors, status);

  const label = status.charAt(0).toUpperCase() + status.slice(1);

  if (size === 'small') {
    return (
      <View style={[s.pill, { backgroundColor: `${color}15` }, s.small]}>
        <View style={[s.dot, { backgroundColor: color }, s.dotSmall]} />
        <Text style={[s.label, { color }, typography.captionBold, s.labelSmall]}>
          {label}
        </Text>
      </View>
    );
  }

  return (
    <View style={[s.pill, { backgroundColor: `${color}15` }]}>
      <View style={[s.dot, { backgroundColor: color }]} />
      <Text style={[s.label, { color }, typography.captionBold]}>
        {label}
      </Text>
    </View>
  );
};

const s = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 6,
  },
  small: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  dotSmall: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  label: {
    fontSize: 11,
    textTransform: 'uppercase',
  },
  labelSmall: {
    fontSize: 9,
  },
});

export default StatusBadge;
