import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';

// Simple test component to verify Expo Go is working
export default function AppSimple() {
  console.log('=== AppSimple is rendering ===');
  
  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>✅ Expo Go is Working!</Text>
        <Text style={styles.subtitle}>Mobile App Test</Text>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Status Check:</Text>
          <Text style={styles.cardText}>✓ React Native rendering</Text>
          <Text style={styles.cardText}>✓ Expo Go connected</Text>
          <Text style={styles.cardText}>✓ JavaScript bundle loaded</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Next Steps:</Text>
          <Text style={styles.cardText}>1. If you see this, Expo Go is working</Text>
          <Text style={styles.cardText}>2. Switch back to main App.js</Text>
          <Text style={styles.cardText}>3. Check TROUBLESHOOTING.md for details</Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            To use the full app, change index.js to import from './App' instead of './AppSimple'
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2ecc71',
    marginTop: 60,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 40,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  cardText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  infoBox: {
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 16,
    marginTop: 20,
    width: '100%',
  },
  infoText: {
    fontSize: 13,
    color: '#1976d2',
    textAlign: 'center',
    lineHeight: 20,
  },
});
