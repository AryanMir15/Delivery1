import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useMutation } from '@apollo/client';
import { useDispatch } from 'react-redux';

import { palette } from '../theme/colors';
import ShokLogo from '../components/ShokLogo';
import { REGISTER_AS_RIDER } from '../api/mutations';
import { updateUser } from '../store/authSlice';

const VEHICLE_TYPES = [
  { key: 'bicycle', label: 'Bicycle', icon: 'bicycle' },
  { key: 'motorcycle', label: 'Motorcycle', icon: 'motorcycle' },
  { key: 'car', label: 'Car', icon: 'car' },
];

export default function RiderRegistrationScreen({ navigation }) {
  const dispatch = useDispatch();
  const [vehicleType, setVehicleType] = useState('motorcycle');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const [registerAsRider] = useMutation(REGISTER_AS_RIDER);

  const handleRegister = async () => {
    if (!licenseNumber.trim()) {
      Alert.alert('Required', 'Please enter your license number');
      return;
    }
    if (!vehicleNumber.trim()) {
      Alert.alert('Required', 'Please enter your vehicle plate number');
      return;
    }

    setLoading(true);
    try {
      const { data } = await registerAsRider({
        variables: {
          vehicleType,
          licenseNumber: licenseNumber.trim(),
          vehicleNumber: vehicleNumber.trim(),
        },
      });

      const rider = data.registerAsRider;
      dispatch(updateUser({
        roles: rider.roles,
        vehicleType: rider.vehicleType,
        licenseNumber: rider.licenseNumber,
        vehicleNumber: rider.vehicleNumber,
      }));

      Alert.alert('Welcome!', 'You are now registered as a rider.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={palette.silver} />
        </TouchableOpacity>
        <ShokLogo size={40} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Become a Rider</Text>
        <Text style={styles.subtitle}>Start earning with shOk. Set your own hours.</Text>

        {/* Vehicle Type */}
        <Text style={styles.label}>Vehicle Type</Text>
        <View style={styles.vehicleGrid}>
          {VEHICLE_TYPES.map((v) => (
            <TouchableOpacity
              key={v.key}
              style={[styles.vehicleCard, vehicleType === v.key && styles.vehicleCardActive]}
              onPress={() => setVehicleType(v.key)}
              activeOpacity={0.7}
            >
              <Icon
                name={v.icon}
                size={28}
                color={vehicleType === v.key ? palette.silver : palette.gray500}
              />
              <Text style={[styles.vehicleLabel, vehicleType === v.key && styles.vehicleLabelActive]}>
                {v.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* License Number */}
        <Text style={styles.label}>License Number</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. JL-12345"
          placeholderTextColor="#666"
          value={licenseNumber}
          onChangeText={setLicenseNumber}
          autoCapitalize="characters"
        />

        {/* Vehicle Plate Number */}
        <Text style={styles.label}>Vehicle Plate Number</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. ABC-1234"
          placeholderTextColor="#666"
          value={vehicleNumber}
          onChangeText={setVehicleNumber}
          autoCapitalize="characters"
        />

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleRegister}
          disabled={loading}
          activeOpacity={0.7}
        >
          {loading ? (
            <ActivityIndicator color={palette.black} />
          ) : (
            <Text style={styles.submitText}>Register as Rider</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.note}>You can toggle online/offline anytime from the top bar.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.black },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  backBtn: { padding: 8 },
  content: { paddingHorizontal: 24, paddingBottom: 40 },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: palette.silver,
    marginTop: 8,
  },
  subtitle: {
    fontSize: 15,
    color: palette.gray500,
    marginTop: 4,
    marginBottom: 28,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.silverDark,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 20,
  },
  vehicleGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  vehicleCard: {
    flex: 1,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2C2C2E',
  },
  vehicleCardActive: {
    borderColor: palette.silver,
    backgroundColor: '#1C1C1E',
  },
  vehicleLabel: {
    fontSize: 12,
    color: palette.gray500,
    marginTop: 6,
    fontWeight: '600',
  },
  vehicleLabelActive: {
    color: palette.silver,
  },
  input: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2C2C2E',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: palette.silver,
  },
  submitBtn: {
    backgroundColor: palette.silver,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitText: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.black,
  },
  note: {
    fontSize: 13,
    color: palette.gray500,
    textAlign: 'center',
    marginTop: 16,
  },
});
