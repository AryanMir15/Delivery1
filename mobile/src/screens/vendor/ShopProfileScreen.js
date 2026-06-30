import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { useMutation } from '@apollo/client';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, getStatusColor } from '../../theme';
import useResponsive from '../../hooks/useResponsive';

import { UPDATE_RESTAURANT } from '../../api/mutations';
import { updateShop } from '../../store/vendorShopSlice';

export default function ShopProfileScreen({ navigation }) {
  const dispatch = useDispatch();
  const { colors, typography } = useTheme();
  const { scale } = useResponsive();
  const { shop } = useSelector((state) => state.vendorShop);

  const [formData, setFormData] = useState({
    name: shop?.name || '',
    address: shop?.address || '',
    phone: shop?.phone || '',
    email: shop?.email || '',
    minimumOrder: shop?.minimumOrder?.toString() || '0',
    deliveryTime: shop?.deliveryTime?.toString() || '30',
    tax: shop?.tax?.toString() || '0',
    isAvailable: shop?.isAvailable || false,
  });

  const [updateRestaurant, { loading }] = useMutation(UPDATE_RESTAURANT);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Shop name is required');
      return;
    }

    try {
      const { data } = await updateRestaurant({
        variables: {
          id: shop._id,
          name: formData.name,
          address: formData.address,
          phone: formData.phone,
          email: formData.email,
          minimumOrder: parseFloat(formData.minimumOrder) || 0,
          deliveryTime: parseInt(formData.deliveryTime) || 30,
          tax: parseFloat(formData.tax) || 0,
          isAvailable: formData.isAvailable,
        },
      });

      if (data?.updateRestaurant) {
        dispatch(updateShop(data.updateRestaurant));
        Alert.alert('Success', 'Shop settings updated successfully');
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update shop settings');
    }
  };

  const s = styles(colors, typography, scale);

  return (
    <SafeAreaView style={s.container} edges={['top']}>
    <ScrollView style={s.container} contentContainerStyle={s.scrollInner}>
      <View style={s.form}>
        {/* Shop Name */}
        <View style={s.inputGroup}>
          <Text style={s.label}>Shop Name *</Text>
          <TextInput
            style={s.input}
            placeholder="Enter shop name"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
          />
        </View>

        {/* Address */}
        <View style={s.inputGroup}>
          <Text style={s.label}>Address</Text>
          <TextInput
            style={[s.input, s.textArea]}
            placeholder="Enter shop address"
            value={formData.address}
            onChangeText={(text) => setFormData({ ...formData, address: text })}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Phone */}
        <View style={s.inputGroup}>
          <Text style={s.label}>Phone Number</Text>
          <TextInput
            style={s.input}
            placeholder="Enter phone number"
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            keyboardType="phone-pad"
          />
        </View>

        {/* Email */}
        <View style={s.inputGroup}>
          <Text style={s.label}>Email</Text>
          <TextInput
            style={s.input}
            placeholder="Enter email address"
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Minimum Order */}
        <View style={s.inputGroup}>
          <Text style={s.label}>Minimum Order Amount (PKR)</Text>
          <TextInput
            style={s.input}
            placeholder="0"
            value={formData.minimumOrder}
            onChangeText={(text) =>
              setFormData({ ...formData, minimumOrder: text })
            }
            keyboardType="decimal-pad"
          />
          <Text style={s.hint}>
            Customers must order at least this amount
          </Text>
        </View>

        {/* Delivery Time */}
        <View style={s.inputGroup}>
          <Text style={s.label}>Estimated Delivery Time (minutes)</Text>
          <TextInput
            style={s.input}
            placeholder="30"
            value={formData.deliveryTime}
            onChangeText={(text) =>
              setFormData({ ...formData, deliveryTime: text })
            }
            keyboardType="number-pad"
          />
          <Text style={s.hint}>
            Average time to prepare and deliver orders
          </Text>
        </View>

        {/* Tax */}
        <View style={s.inputGroup}>
          <Text style={s.label}>Tax Rate (%)</Text>
          <TextInput
            style={s.input}
            placeholder="0"
            value={formData.tax}
            onChangeText={(text) => setFormData({ ...formData, tax: text })}
            keyboardType="decimal-pad"
          />
          <Text style={s.hint}>Tax percentage applied to orders</Text>
        </View>

        {/* Shop Availability */}
        <View style={s.switchGroup}>
          <View style={s.switchLabel}>
            <Ionicons
              name={formData.isAvailable ? 'checkmark-circle' : 'close-circle'}
              size={24}
              color={formData.isAvailable ? colors.success : colors.error}
            />
            <View style={s.switchText}>
              <Text style={s.label}>Shop Status</Text>
              <Text style={s.hint}>
                {formData.isAvailable
                  ? 'Shop is currently open for orders'
                  : 'Shop is currently closed'}
              </Text>
            </View>
          </View>
          <Switch
            value={formData.isAvailable}
            onValueChange={(value) =>
              setFormData({ ...formData, isAvailable: value })
            }
            trackColor={{ false: colors.divider, true: colors.success }}
            thumbColor={colors.textInverse}
          />
        </View>

        {/* Info Card */}
        <View style={s.infoCard}>
          <Ionicons name="information-circle" size={24} color={colors.info} />
          <Text style={s.infoText}>
            These settings affect how customers see and interact with your shop.
            Make sure all information is accurate and up to date.
          </Text>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[s.saveButton, loading && s.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={s.saveButtonText}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = (colors, typography, scale = 1) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollInner: {
    paddingBottom: Math.round(40 * scale),
  },
  form: {
    padding: Math.round(20 * scale),
  },
  inputGroup: {
    marginBottom: Math.round(20 * scale),
  },
  label: {
    fontSize: Math.round(16 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: Math.round(8 * scale),
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: Math.round(8 * scale),
    padding: Math.round(12 * scale),
    fontSize: Math.round(16 * scale),
    color: colors.textPrimary,
  },
  textArea: {
    height: Math.round(80 * scale),
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: Math.round(12 * scale),
    color: colors.textTertiary,
    marginTop: Math.round(5 * scale),
  },
  switchGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: Math.round(15 * scale),
    borderRadius: Math.round(10 * scale),
    marginBottom: Math.round(20 * scale),
    borderWidth: 1,
    borderColor: colors.divider,
  },
  switchLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Math.round(10 * scale),
  },
  switchText: {
    flex: 1,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: `${colors.info}15`,
    padding: Math.round(15 * scale),
    borderRadius: Math.round(10 * scale),
    marginBottom: Math.round(20 * scale),
    gap: Math.round(10 * scale),
  },
  infoText: {
    flex: 1,
    fontSize: Math.round(14 * scale),
    color: colors.info,
    lineHeight: 20,
  },
  saveButton: {
    backgroundColor: colors.accent,
    padding: Math.round(16 * scale),
    borderRadius: Math.round(10 * scale),
    alignItems: 'center',
    marginBottom: Math.round(40 * scale),
  },
  saveButtonDisabled: {
    backgroundColor: colors.buttonDisabled,
  },
  saveButtonText: {
    color: colors.textInverse,
    fontSize: Math.round(18 * scale),
    fontWeight: 'bold',
  },
});
