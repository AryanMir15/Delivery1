import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { MaterialIcons } from '@expo/vector-icons';

const OfflineNotice = () => {
  const isOnline = useSelector((state) => state.offline?.isOnline ?? true);

  if (isOnline) return null;

  return (
    <View style={styles.container}>
      <MaterialIcons name="cloud-off" size={16} color="#fff" />
      <Text style={styles.text}>Offline Mode - Using cached data</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ff6b6b',
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  text: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default OfflineNotice;
