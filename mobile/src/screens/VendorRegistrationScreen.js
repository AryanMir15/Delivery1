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
import { useDispatch, useSelector } from 'react-redux';

import { palette } from '../theme/colors';
import ShokLogo from '../components/ShokLogo';
import { REGISTER_AS_VENDOR } from '../api/mutations';
import { updateUser } from '../store/authSlice';

const SHOP_TYPES = [
  { key: 'restaurant', label: 'Restaurant' },
  { key: 'grocery', label: 'Grocery' },
  { key: 'pharmacy', label: 'Pharmacy' },
  { key: 'bakery', label: 'Bakery' },
  { key: 'other', label: 'Other' },
];

export default function VendorRegistrationScreen({ navigation }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [step, setStep] = useState(1);
  const [shopName, setShopName] = useState('');
  const [shopType, setShopType] = useState('restaurant');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);

  const [registerAsVendor] = useMutation(REGISTER_AS_VENDOR);

  const handleNext = () => {
    if (!shopName.trim()) {
      Alert.alert('Required', 'Please enter your shop name');
      return;
    }
    setStep(2);
  };

  const handleRegister = async () => {
    if (!address.trim()) {
      Alert.alert('Required', 'Please enter your shop address');
      return;
    }

    setLoading(true);
    try {
      const { data } = await registerAsVendor({
        variables: {
          shopName: shopName.trim(),
          shopType,
          address: address.trim(),
          phone: phone.trim() || undefined,
        },
      });

      const restaurant = data.registerAsVendor;

      dispatch(updateUser({
        roles: [...(user?.roles || [user?.role || 'customer']), 'vendor'],
      }));

      Alert.alert(
        'Shop Created!',
        `"${restaurant.name}" is ready. Add your products to start receiving orders.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
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
        <View style={styles.stepIndicator}>
          <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]} />
          <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {step === 1 ? (
          <>
            <Text style={styles.title}>Open Your Shop</Text>
            <Text style={styles.subtitle}>Set up your shop on shOk and reach more customers.</Text>

            {/* Shop Name */}
            <Text style={styles.label}>Shop Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Baba Food Corner"
              placeholderTextColor="#666"
              value={shopName}
              onChangeText={setShopName}
            />

            {/* Shop Type */}
            <Text style={styles.label}>Category</Text>
            <View style={styles.typeGrid}>
              {SHOP_TYPES.map((t) => (
                <TouchableOpacity
                  key={t.key}
                  style={[styles.typeCard, shopType === t.key && styles.typeCardActive]}
                  onPress={() => setShopType(t.key)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.typeLabel, shopType === t.key && styles.typeLabelActive]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleNext}
              activeOpacity={0.7}
            >
              <Text style={styles.submitText}>Next</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.title}>Shop Details</Text>
            <Text style={styles.subtitle}>Where can riders pick up orders?</Text>

            {/* Address */}
            <Text style={styles.label}>Shop Address</Text>
            <TextInput
              style={styles.input}
              placeholder="Full address with landmark"
              placeholderTextColor="#666"
              value={address}
              onChangeText={setAddress}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            {/* Phone */}
            <Text style={styles.label}>Contact Phone (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder={user?.phone || 'Phone number'}
              placeholderTextColor="#666"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.backBtnLarge}
                onPress={() => setStep(1)}
                activeOpacity={0.7}
              >
                <Text style={styles.backText}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitBtn, styles.submitBtnFlex, loading && styles.submitBtnDisabled]}
                onPress={handleRegister}
                disabled={loading}
                activeOpacity={0.7}
              >
                {loading ? (
                  <ActivityIndicator color={palette.black} />
                ) : (
                  <Text style={styles.submitText}>Open Shop</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
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
  stepIndicator: { flexDirection: 'row', gap: 6 },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2C2C2E',
  },
  stepDotActive: {
    backgroundColor: palette.silver,
  },
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
  input: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2C2C2E',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: palette.silver,
    minHeight: 52,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  typeCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#2C2C2E',
  },
  typeCardActive: {
    borderColor: palette.silver,
  },
  typeLabel: {
    fontSize: 14,
    color: palette.gray500,
    fontWeight: '600',
  },
  typeLabelActive: {
    color: palette.silver,
  },
  submitBtn: {
    backgroundColor: palette.silver,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  submitBtnFlex: { flex: 1 },
  submitBtnDisabled: { opacity: 0.5 },
  submitText: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.black,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
  },
  backBtnLarge: {
    backgroundColor: '#2C2C2E',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  backText: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.silver,
  },
});
