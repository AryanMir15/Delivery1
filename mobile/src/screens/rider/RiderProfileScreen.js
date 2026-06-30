import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useQuery } from '@apollo/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useTheme } from '../../theme';
import useResponsive from '../../hooks/useResponsive';
import StatusBadge from '../../components/StatusBadge';
import { GET_ME, GET_RIDER_PROFILE, GET_RIDER_ORDERS } from '../../api/queries';
import { logout } from '../../store/authSlice';
import socketService from '../../services/socketService';
import LocationService from '../../services/rider/LocationService';

const ProfileScreen = () => {
  const dispatch = useDispatch();
  const { colors, typography } = useTheme();
  const { scale } = useResponsive();
  const { user: rider, isAvailable } = useSelector((state) => state.auth);

  const { data: meData } = useQuery(GET_ME, {
    fetchPolicy: 'cache-first',
  });

  const { data: ordersData } = useQuery(GET_RIDER_ORDERS, {
    fetchPolicy: 'cache-first',
  });

  const riderProfile = meData?.me || rider;
  const orders = ordersData?.ordersByRider || [];

  const completedOrders = orders.filter((o) => o.orderStatus === 'delivered').length;
  const totalEarnings = orders
    .filter((o) => o.orderStatus === 'delivered')
    .reduce((sum, order) => sum + (order.deliveryCharges || 0) + (order.tipping || 0), 0);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            // Stop location tracking
            LocationService.stopTracking();

            // Disconnect socket
            socketService.disconnect();

            // Clear token
            await AsyncStorage.removeItem('riderToken');

            // Dispatch logout
            dispatch(logout());

            console.log('✅ Logged out successfully');
          } catch (error) {
            console.error('Error during logout:', error);
          }
        },
      },
    ]);
  };

  const handleContactSupport = () => {
    Alert.alert('Contact Support', 'Choose a contact method:', [
      {
        text: 'Email',
        onPress: () => Linking.openURL('mailto:support@deliveryapp.com'),
      },
      {
        text: 'Phone',
        onPress: () => Linking.openURL('tel:+251911234567'),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleAbout = () => {
    Alert.alert(
      'About Rider App',
      'Version 1.0.0\n\nDelivery platform for riders to accept and complete orders.\n\n© 2024 Delivery App',
      [{ text: 'OK' }]
    );
  };

  const s = styles(colors, typography, scale);

  const MenuItem = ({ icon, title, subtitle, onPress, iconColor = colors.accent, showChevron = true }) => (
    <TouchableOpacity style={s.menuItem} onPress={onPress}>
      <View style={s.menuLeft}>
        <View style={[s.iconContainer, { backgroundColor: `${iconColor}15` }]}>
          <Icon name={icon} size={22} color={iconColor} />
        </View>
        <View style={s.menuTextContainer}>
          <Text style={s.menuTitle}>{title}</Text>
          {subtitle && <Text style={s.menuSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {showChevron && <Icon name="chevron-right" size={24} color={colors.border} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Profile</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={s.profileCard}>
          <View style={s.avatarContainer}>
            <View style={s.avatar}>
              <Icon name="account" size={50} color={colors.surface} />
            </View>
            <View
              style={[
                s.statusIndicator,
                { backgroundColor: isAvailable ? colors.success : colors.error },
              ]}
            />
          </View>

          <Text style={s.name}>{riderProfile?.name || 'Rider Name'}</Text>
          <Text style={s.email}>{riderProfile?.email || 'rider@example.com'}</Text>

          {riderProfile?.phone && (
            <View style={s.phoneContainer}>
              <Icon name="phone" size={16} color={colors.textSecondary} />
              <Text style={s.phone}>{riderProfile.phone}</Text>
            </View>
          )}

          <StatusBadge status={isAvailable ? 'online' : 'offline'} />
        </View>

        {/* Stats Card */}
        <View style={s.statsCard}>
          <View style={s.statItem}>
            <Icon name="bike-fast" size={28} color={colors.accent} />
            <Text style={s.statValue}>{completedOrders}</Text>
            <Text style={s.statLabel}>Deliveries</Text>
          </View>

          <View style={s.statDivider} />

          <View style={s.statItem}>
            <Icon name="cash-multiple" size={28} color={colors.accent} />
            <Text style={s.statValue}>PKR {totalEarnings.toFixed(0)}</Text>
            <Text style={s.statLabel}>Earned</Text>
          </View>

          <View style={s.statDivider} />

          <View style={s.statItem}>
            <Icon name="star" size={28} color="#FFC107" />
            <Text style={s.statValue}>5.0</Text>
            <Text style={s.statLabel}>Rating</Text>
          </View>
        </View>

        {/* Vehicle Information */}
        {(riderProfile?.vehicleType || riderProfile?.vehicleNumber) && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Vehicle Information</Text>
            <View style={s.vehicleCard}>
              {riderProfile?.vehicleType && (
                <View style={s.vehicleRow}>
                  <Icon name="motorbike" size={20} color={colors.textSecondary} />
                  <Text style={s.vehicleLabel}>Type:</Text>
                  <Text style={s.vehicleValue}>{riderProfile.vehicleType}</Text>
                </View>
              )}
              {riderProfile?.vehicleNumber && (
                <View style={s.vehicleRow}>
                  <Icon name="card-text" size={20} color={colors.textSecondary} />
                  <Text style={s.vehicleLabel}>Plate:</Text>
                  <Text style={s.vehicleValue}>{riderProfile.vehicleNumber}</Text>
                </View>
              )}
              {riderProfile?.licenseNumber && (
                <View style={s.vehicleRow}>
                  <Icon name="card-account-details" size={20} color={colors.textSecondary} />
                  <Text style={s.vehicleLabel}>License:</Text>
                  <Text style={s.vehicleValue}>{riderProfile.licenseNumber}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Account Section */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Account</Text>
          <View style={s.menuContainer}>
            <MenuItem
              icon="account-edit"
              title="Edit Profile"
              subtitle="Update your personal information"
              onPress={() => Alert.alert('Coming Soon', 'Profile editing will be available soon')}
            />
            <MenuItem
              icon="lock-outline"
              title="Change Password"
              subtitle="Update your password"
              onPress={() => Alert.alert('Coming Soon', 'Password change will be available soon')}
            />
            <MenuItem
              icon="shield-check"
              title="Privacy & Security"
              subtitle="Manage your privacy settings"
              onPress={() => Alert.alert('Coming Soon', 'Privacy settings will be available soon')}
            />
          </View>
        </View>

        {/* App Settings */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>App Settings</Text>
          <View style={s.menuContainer}>
            <MenuItem
              icon="bell-outline"
              title="Notifications"
              subtitle="Manage notification preferences"
              onPress={() => Alert.alert('Coming Soon', 'Notification settings will be available soon')}
            />
            <MenuItem
              icon="map-marker-outline"
              title="Location Services"
              subtitle="GPS and tracking settings"
              onPress={() => Alert.alert('Coming Soon', 'Location settings will be available soon')}
            />
            <MenuItem
              icon="translate"
              title="Language"
              subtitle="English"
              onPress={() => Alert.alert('Coming Soon', 'Language selection will be available soon')}
            />
          </View>
        </View>

        {/* Support Section */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Support</Text>
          <View style={s.menuContainer}>
            <MenuItem
              icon="help-circle-outline"
              title="Help Center"
              subtitle="FAQs and guides"
              iconColor="#17A2B8"
              onPress={() => Alert.alert('Help Center', 'Visit our help center for FAQs and guides')}
            />
            <MenuItem
              icon="phone-outline"
              title="Contact Support"
              subtitle="Get help from our team"
              iconColor="#17A2B8"
              onPress={handleContactSupport}
            />
            <MenuItem
              icon="file-document-outline"
              title="Terms & Conditions"
              subtitle="Read our terms"
              iconColor="#17A2B8"
              onPress={() => Alert.alert('Coming Soon', 'Terms & Conditions will be available soon')}
            />
            <MenuItem
              icon="information-outline"
              title="About"
              subtitle="Version 1.0.0"
              iconColor="#17A2B8"
              onPress={handleAbout}
            />
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={s.logoutButton} onPress={handleLogout}>
          <Icon name="logout" size={24} color={colors.error} />
          <Text style={s.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={s.footer}>
          <Text style={s.footerText}>Rider App v1.0.0</Text>
          <Text style={s.footerSubtext}>© 2024 Delivery Platform</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = (colors, typography, scale = 1) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.surface,
    paddingHorizontal: Math.round(16 * scale),
    paddingTop: Math.round(16 * scale),
    paddingBottom: Math.round(12 * scale),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: Math.round(28 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  profileCard: {
    backgroundColor: colors.surface,
    marginHorizontal: Math.round(16 * scale),
    marginTop: Math.round(16 * scale),
    borderRadius: Math.round(16 * scale),
    padding: Math.round(24 * scale),
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: Math.round(2 * scale) },
    shadowOpacity: 0.1,
    shadowRadius: Math.round(4 * scale),
    elevation: 3,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: Math.round(16 * scale),
  },
  avatar: {
    width: Math.round(100 * scale),
    height: Math.round(100 * scale),
    borderRadius: Math.round(50 * scale),
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: Math.round(4 * scale),
    right: Math.round(4 * scale),
    width: Math.round(20 * scale),
    height: Math.round(20 * scale),
    borderRadius: Math.round(10 * scale),
    borderWidth: 3,
    borderColor: colors.surface,
  },
  name: {
    fontSize: Math.round(24 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: Math.round(4 * scale),
  },
  email: {
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
    marginBottom: Math.round(8 * scale),
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Math.round(12 * scale),
  },
  phone: {
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
    marginLeft: Math.round(6 * scale),
  },

  statsCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    marginHorizontal: Math.round(16 * scale),
    marginTop: Math.round(12 * scale),
    borderRadius: Math.round(12 * scale),
    padding: Math.round(16 * scale),
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: Math.round(2 * scale) },
    shadowOpacity: 0.1,
    shadowRadius: Math.round(4 * scale),
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: Math.round(18 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: Math.round(8 * scale),
  },
  statLabel: {
    fontSize: Math.round(12 * scale),
    color: colors.textSecondary,
    marginTop: Math.round(4 * scale),
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  section: {
    marginTop: Math.round(24 * scale),
    paddingHorizontal: Math.round(16 * scale),
  },
  sectionTitle: {
    fontSize: Math.round(14 * scale),
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: Math.round(8 * scale),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  vehicleCard: {
    backgroundColor: colors.surface,
    borderRadius: Math.round(12 * scale),
    padding: Math.round(16 * scale),
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: Math.round(2 * scale) },
    shadowOpacity: 0.1,
    shadowRadius: Math.round(4 * scale),
    elevation: 3,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Math.round(12 * scale),
  },
  vehicleLabel: {
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
    marginLeft: Math.round(12 * scale),
    width: Math.round(60 * scale),
  },
  vehicleValue: {
    fontSize: Math.round(14 * scale),
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  menuContainer: {
    backgroundColor: colors.surface,
    borderRadius: Math.round(12 * scale),
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: Math.round(2 * scale) },
    shadowOpacity: 0.1,
    shadowRadius: Math.round(4 * scale),
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Math.round(16 * scale),
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: Math.round(40 * scale),
    height: Math.round(40 * scale),
    borderRadius: Math.round(20 * scale),
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuTextContainer: {
    marginLeft: Math.round(12 * scale),
    flex: 1,
  },
  menuTitle: {
    fontSize: Math.round(16 * scale),
    fontWeight: '500',
    color: colors.textPrimary,
  },
  menuSubtitle: {
    fontSize: Math.round(12 * scale),
    color: colors.textSecondary,
    marginTop: Math.round(2 * scale),
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: Math.round(16 * scale),
    marginTop: Math.round(24 * scale),
    borderRadius: Math.round(12 * scale),
    padding: Math.round(16 * scale),
    borderWidth: 2,
    borderColor: colors.error,
  },
  logoutText: {
    fontSize: Math.round(16 * scale),
    fontWeight: '600',
    color: colors.error,
    marginLeft: Math.round(10 * scale),
  },
  footer: {
    alignItems: 'center',
    paddingVertical: Math.round(24 * scale),
  },
  footerText: {
    fontSize: Math.round(12 * scale),
    color: colors.textSecondary,
  },
  footerSubtext: {
    fontSize: Math.round(11 * scale),
    color: colors.textSecondary,
    marginTop: Math.round(4 * scale),
  },
});

export default ProfileScreen;
