import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../theme';

const OfflineNotice = () => {
  const { colors, typography } = useTheme();
  const isOnline = useSelector((state) => state.offline?.isOnline ?? true);

  if (isOnline) return null;

  const styles = (colors, typography) => StyleSheet.create({
    container: {
      backgroundColor: colors.error,
      padding: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    text: {
      color: colors.textInverse,
      fontSize: 12,
      fontWeight: '600',
    },
  });

  const s = styles(colors, typography);

  return (
    <View style={s.container}>
      <MaterialIcons name="cloud-off" size={16} color={colors.textInverse} />
      <Text style={s.text}>Offline Mode - Using cached data</Text>
    </View>
  );
};

export default OfflineNotice;
