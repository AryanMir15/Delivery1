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
import { useSelector, useDispatch } from 'react-redux';
import { useMutation } from '@apollo/client';
import { Ionicons } from '@expo/vector-icons';

import { UPDATE_RESTAURANT } from '../api/mutations';
import { updateShop } from '../store/vendorShopSlice';

export default function ShopProfileScreen({ navigation }) {
  const dispatch = useDispatch();
  const { shop } = useSelector((state) => state.shop);

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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        {/* Shop Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Shop Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter shop name"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
          />
        </View>

        {/* Address */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Address</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter shop address"
            value={formData.address}
            onChangeText={(text) => setFormData({ ...formData, address: text })}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Phone */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter phone number"
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            keyboardType="phone-pad"
          />
        </View>

        {/* Email */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter email address"
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Minimum Order */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Minimum Order Amount (ETB)</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            value={formData.minimumOrder}
            onChangeText={(text) =>
              setFormData({ ...formData, minimumOrder: text })
            }
            keyboardType="decimal-pad"
          />
          <Text style={styles.hint}>
            Customers must order at least this amount
          </Text>
        </View>

        {/* Delivery Time */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Estimated Delivery Time (minutes)</Text>
          <TextInput
            style={styles.input}
            placeholder="30"
            value={formData.deliveryTime}
            onChangeText={(text) =>
              setFormData({ ...formData, deliveryTime: text })
            }
            keyboardType="number-pad"
          />
          <Text style={styles.hint}>
            Average time to prepare and deliver orders
          </Text>
        </View>

        {/* Tax */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tax Rate (%)</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            value={formData.tax}
            onChangeText={(text) => setFormData({ ...formData, tax: text })}
            keyboardType="decimal-pad"
          />
          <Text style={styles.hint}>Tax percentage applied to orders</Text>
        </View>

        {/* Shop Availability */}
        <View style={styles.switchGroup}>
          <View style={styles.switchLabel}>
            <Ionicons
              name={formData.isAvailable ? 'checkmark-circle' : 'close-circle'}
              size={24}
              color={formData.isAvailable ? '#4CAF50' : '#F44336'}
            />
            <View style={styles.switchText}>
              <Text style={styles.label}>Shop Status</Text>
              <Text style={styles.hint}>
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
            trackColor={{ false: '#ccc', true: '#4CAF50' }}
            thumbColor="#fff"
          />
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color="#2196F3" />
          <Text style={styles.infoText}>
            These settings affect how customers see and interact with your shop.
            Make sure all information is accurate and up to date.
          </Text>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  switchGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  switchLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  switchText: {
    flex: 1,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1976D2',
    lineHeight: 20,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 40,
  },
  saveButtonDisabled: {
    backgroundColor: '#a5d6a7',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
