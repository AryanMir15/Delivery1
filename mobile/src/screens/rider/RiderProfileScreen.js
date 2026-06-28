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

import { GET_ME, GET_RIDER_PROFILE, GET_RIDER_ORDERS } from '../api/queries';
import { logout } from '../store/authSlice';
import socketService from '../services/socketService';
import LocationService from '../services/rider/LocationService';

const ProfileScreen = () => {
  const dispatch = useDispatch();
  const { rider, isAvailable } = useSelector((state) => state.auth);

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

  const MenuItem = ({ icon, title, subtitle, onPress, iconColor = '#2EC4B6', showChevron = true }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuLeft}>
        <View style={[styles.iconContainer, { backgroundColor: `${iconColor}15` }]}>
          <Icon name={icon} size={22} color={iconColor} />
        </View>
        <View style={styles.menuTextContainer}>
          <Text style={styles.menuTitle}>{title}</Text>
          {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {showChevron && <Icon name="chevron-right" size={24} color="#CED4DA" />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Icon name="account" size={50} color="#FFFFFF" />
            </View>
            <View
              style={[
                styles.statusIndicator,
                { backgroundColor: isAvailable ? '#28A745' : '#E63946' },
              ]}
            />
          </View>

          <Text style={styles.name}>{riderProfile?.name || 'Rider Name'}</Text>
          <Text style={styles.email}>{riderProfile?.email || 'rider@example.com'}</Text>

          {riderProfile?.phone && (
            <View style={styles.phoneContainer}>
              <Icon name="phone" size={16} color="#6C757D" />
              <Text style={styles.phone}>{riderProfile.phone}</Text>
            </View>
          )}

          <View style={styles.statusBadge}>
            <Icon
              name={isAvailable ? 'check-circle' : 'close-circle'}
              size={16}
              color={isAvailable ? '#28A745' : '#E63946'}
            />
            <Text style={[styles.statusText, { color: isAvailable ? '#28A745' : '#E63946' }]}>
              {isAvailable ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>

        {/* Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Icon name="bike-fast" size={28} color="#2EC4B6" />
            <Text style={styles.statValue}>{completedOrders}</Text>
            <Text style={styles.statLabel}>Deliveries</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Icon name="cash-multiple" size={28} color="#2EC4B6" />
            <Text style={styles.statValue}>ETB {totalEarnings.toFixed(0)}</Text>
            <Text style={styles.statLabel}>Earned</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Icon name="star" size={28} color="#FFC107" />
            <Text style={styles.statValue}>5.0</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>

        {/* Vehicle Information */}
        {(riderProfile?.vehicleType || riderProfile?.vehicleNumber) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vehicle Information</Text>
            <View style={styles.vehicleCard}>
              {riderProfile?.vehicleType && (
                <View style={styles.vehicleRow}>
                  <Icon name="motorbike" size={20} color="#6C757D" />
                  <Text style={styles.vehicleLabel}>Type:</Text>
                  <Text style={styles.vehicleValue}>{riderProfile.vehicleType}</Text>
                </View>
              )}
              {riderProfile?.vehicleNumber && (
                <View style={styles.vehicleRow}>
                  <Icon name="card-text" size={20} color="#6C757D" />
                  <Text style={styles.vehicleLabel}>Plate:</Text>
                  <Text style={styles.vehicleValue}>{riderProfile.vehicleNumber}</Text>
                </View>
              )}
              {riderProfile?.licenseNumber && (
                <View style={styles.vehicleRow}>
                  <Icon name="card-account-details" size={20} color="#6C757D" />
                  <Text style={styles.vehicleLabel}>License:</Text>
                  <Text style={styles.vehicleValue}>{riderProfile.licenseNumber}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.menuContainer}>
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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Settings</Text>
          <View style={styles.menuContainer}>
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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.menuContainer}>
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
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icon name="logout" size={24} color="#E63946" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Rider App v1.0.0</Text>
          <Text style={styles.footerSubtext}>© 2024 Delivery Platform</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1D3557',
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#2EC4B6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1D3557',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 8,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  phone: {
    fontSize: 14,
    color: '#6C757D',
    marginLeft: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1D3557',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6C757D',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E9ECEF',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6C757D',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  vehicleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  vehicleLabel: {
    fontSize: 14,
    color: '#6C757D',
    marginLeft: 12,
    width: 60,
  },
  vehicleValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1D3557',
    flex: 1,
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1D3557',
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#6C757D',
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 24,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E63946',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E63946',
    marginLeft: 10,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 12,
    color: '#6C757D',
  },
  footerSubtext: {
    fontSize: 11,
    color: '#ADB5BD',
    marginTop: 4,
  },
});

export default ProfileScreen;
