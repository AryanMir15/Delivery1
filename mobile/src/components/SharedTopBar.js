import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  Switch,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation } from '@apollo/client';

import { palette } from '../theme/colors';
import ShokLogo from './ShokLogo';
import { switchRole, setAvailability, logout } from '../store/authSlice';
import { UPDATE_RIDER_AVAILABILITY } from '../api/mutations';

export default function SharedTopBar() {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user, activeRole, isAvailable } = useSelector((state) => state.auth);
  const shop = useSelector((state) => state.vendorShop?.shop);

  const [menuVisible, setMenuVisible] = useState(false);
  const [updateAvailability] = useMutation(UPDATE_RIDER_AVAILABILITY);

  const userRoles = user?.roles || [user?.role || 'customer'];
  const hasRiderRole = userRoles.includes('rider');
  const hasVendorRole = userRoles.includes('vendor') || userRoles.includes('owner') || userRoles.includes('admin');
  const hasCustomerRole = userRoles.includes('customer');

  const statusDotColor = () => {
    if (activeRole === 'rider') return isAvailable ? palette.green : '#D94F44';
    if (activeRole === 'vendor' || activeRole === 'owner' || activeRole === 'admin') {
      return shop?.isAvailable ? palette.green : '#D94F44';
    }
    return palette.green;
  };

  const handleSwitchRole = (role) => {
    dispatch(switchRole(role));
    setMenuVisible(false);
  };

  const handleToggleOnline = async () => {
    if (activeRole === 'rider') {
      const newStatus = !isAvailable;
      try {
        await updateAvailability({
          variables: {
            id: user.id || user._id,
            available: newStatus,
          },
        });
        dispatch(setAvailability(newStatus));
      } catch (err) {
        console.log('Availability toggle error:', err.message);
      }
    }
  };

  const isOnline = activeRole === 'rider' ? isAvailable : shop?.isAvailable;
  const toggleLabel = activeRole === 'rider'
    ? (isAvailable ? 'Online' : 'Offline')
    : (shop?.isAvailable ? 'Open' : 'Closed');
  const showToggle = activeRole === 'rider' || activeRole === 'vendor' || activeRole === 'owner' || activeRole === 'admin';

  const allRoles = [
    { key: 'customer', label: 'Customer', icon: 'account', registered: hasCustomerRole, screen: null },
    { key: 'rider', label: 'Rider', icon: 'bike', registered: hasRiderRole, screen: 'RiderRegistration' },
    { key: 'vendor', label: 'Merchant', icon: 'store', registered: hasVendorRole, screen: 'VendorRegistration' },
  ];

  return (
    <>
      <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
        <ShokLogo size={40} />

        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => setMenuVisible(true)}
          activeOpacity={0.7}
        >
          <Icon name="account-circle" size={32} color={palette.silver} />
          <View style={[styles.statusDot, { backgroundColor: statusDotColor() }]} />
        </TouchableOpacity>
      </View>

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setMenuVisible(false)}>
          <Pressable style={styles.dropdown} onPress={(e) => e.stopPropagation()}>
            {/* Role Switching */}
            <Text style={styles.dropdownLabel}>Switch App</Text>
            {allRoles.map((r) => {
              const isActive = activeRole === r.key;
              return (
                <TouchableOpacity
                  key={r.key}
                  style={[styles.menuItem, isActive && styles.menuItemActive]}
                  onPress={() => {
                    if (r.registered) {
                      handleSwitchRole(r.key);
                    } else if (r.screen) {
                      setMenuVisible(false);
                      navigation.getParent()?.navigate(r.screen);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <Icon name={r.icon} size={20} color={isActive ? palette.silver : palette.gray500} />
                  <Text style={[styles.menuItemText, isActive && styles.menuItemTextActive]}>
                    {r.registered
                      ? (isActive ? r.label : `Switch to ${r.label}`)
                      : `Become a ${r.label}`}
                  </Text>
                  {isActive && <Icon name="check" size={18} color={palette.silver} />}
                  {!r.registered && r.screen && <Icon name="chevron-right" size={18} color={palette.gray500} />}
                </TouchableOpacity>
              );
            })}

            {/* Availability Toggle */}
            {showToggle && (
              <>
                <View style={styles.divider} />
                <View style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>{toggleLabel}</Text>
                  <Switch
                    value={!!isOnline}
                    onValueChange={handleToggleOnline}
                    trackColor={{ false: '#3A3A3C', true: '#2A4A2A' }}
                    thumbColor={isOnline ? palette.green : palette.gray500}
                  />
                </View>
              </>
            )}

            {/* Sign Out */}
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                dispatch(logout());
              }}
              activeOpacity={0.7}
            >
              <Icon name="logout" size={20} color="#D94F44" />
              <Text style={[styles.menuItemText, { color: '#D94F44' }]}>Sign Out</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: palette.black,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1E',
  },
  profileButton: {
    position: 'relative',
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    backgroundColor: palette.green,
    borderColor: palette.black,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    paddingTop: 60,
    alignItems: 'flex-end',
    paddingHorizontal: 16,
  },
  dropdown: {
    backgroundColor: '#1C1C1E',
    borderRadius: 14,
    paddingVertical: 8,
    width: 260,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  dropdownLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: palette.silverDark,
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuItemActive: {
    backgroundColor: '#2C2C2E',
  },
  menuItemText: {
    flex: 1,
    fontSize: 15,
    color: palette.silverLight,
    fontWeight: '500',
  },
  menuItemTextActive: {
    color: palette.silver,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#2C2C2E',
    marginVertical: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.silver,
  },
});
