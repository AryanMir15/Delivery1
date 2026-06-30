import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme, getStatusColor } from '../../theme';
import useResponsive from '../../hooks/useResponsive';

import { logout } from '../../store/authSlice';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { colors, typography } = useTheme();
  const { user } = useSelector((state) => state.auth);
  const { shop } = useSelector((state) => state.vendorShop);
  const { scale } = useResponsive();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => dispatch(logout()),
      },
    ]);
  };

  const menuItems = [
    {
      icon: 'storefront',
      title: 'Shop Settings',
      subtitle: 'Manage your shop details',
      onPress: () => navigation.navigate('ShopProfile'),
      color: colors.accent,
    },
    {
      icon: 'notifications',
      title: 'Notifications',
      subtitle: 'Manage notification preferences',
      onPress: () => Alert.alert('Coming Soon', 'Notification settings'),
      color: colors.warning,
    },
    {
      icon: 'help-circle',
      title: 'Help & Support',
      subtitle: 'Get help or contact support',
      onPress: () => Alert.alert('Support', 'Contact: support@vendorapp.com'),
      color: colors.info,
    },
    {
      icon: 'document-text',
      title: 'Terms & Conditions',
      subtitle: 'Read our terms and policies',
      onPress: () => Alert.alert('Terms', 'Terms and conditions'),
      color: colors.accent,
    },
    {
      icon: 'information-circle',
      title: 'About',
      subtitle: 'App version and information',
      onPress: () => Alert.alert('About', 'Vendor App v1.0.0'),
      color: colors.textSecondary,
    },
  ];

  const s = styles(colors, typography, scale);

  return (
    <SafeAreaView style={s.container} edges={['top']}>
    <ScrollView style={s.container} contentContainerStyle={s.scrollInner}>
      {/* Profile Header */}
      <View style={s.header}>
        <View style={s.avatarContainer}>
          {user?.image ? (
            <Image source={{ uri: user.image }} style={s.avatar} />
          ) : (
            <View style={s.avatarPlaceholder}>
              <Ionicons name="person" size={40} color={colors.textInverse} />
            </View>
          )}
        </View>
        <Text style={s.name}>{user?.name || 'Vendor'}</Text>
        <Text style={s.email}>{user?.email}</Text>
      </View>

      {/* Shop Info Card */}
      {shop && (
        <View style={s.shopCard}>
          <View style={s.shopHeader}>
            <Ionicons name="storefront" size={24} color={colors.accent} />
            <Text style={s.shopName}>{shop.name}</Text>
          </View>
          <View style={s.shopStats}>
            <View style={s.shopStat}>
              <Ionicons name="star" size={16} color={colors.warning} />
              <Text style={s.shopStatText}>
                {shop.rating?.toFixed(1) || '0.0'}
              </Text>
            </View>
            <View style={s.shopStat}>
              <Ionicons name="chatbubbles" size={16} color={colors.info} />
              <Text style={s.shopStatText}>
                {shop.reviewCount || 0} reviews
              </Text>
            </View>
            <View
              style={[
                s.shopStatus,
                shop.isAvailable ? s.shopOpen : s.shopClosed,
              ]}
            >
              <Text style={s.shopStatusText}>
                {shop.isAvailable ? 'Open' : 'Closed'}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Menu Items */}
      <View style={s.menuSection}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={s.menuItem}
            onPress={item.onPress}
          >
            <View style={[s.menuIcon, { backgroundColor: `${item.color}20` }]}>
              <Ionicons name={item.icon} size={24} color={item.color} />
            </View>
            <View style={s.menuContent}>
              <Text style={s.menuTitle}>{item.title}</Text>
              <Text style={s.menuSubtitle}>{item.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={s.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out" size={20} color={colors.error} />
        <Text style={s.logoutText}>Logout</Text>
      </TouchableOpacity>

      <View style={s.footer}>
        <Text style={s.footerText}>Vendor App v1.0.0</Text>
        <Text style={s.footerText}>&copy; 2024 All rights reserved</Text>
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
  header: {
    backgroundColor: colors.surface,
    alignItems: 'center',
    padding: Math.round(30 * scale),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatarContainer: {
    marginBottom: Math.round(15 * scale),
  },
  avatar: {
    width: Math.round(100 * scale),
    height: Math.round(100 * scale),
    borderRadius: Math.round(50 * scale),
  },
  avatarPlaceholder: {
    width: Math.round(100 * scale),
    height: Math.round(100 * scale),
    borderRadius: Math.round(50 * scale),
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: Math.round(24 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: Math.round(5 * scale),
  },
  email: {
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
  },
  shopCard: {
    backgroundColor: colors.surface,
    margin: Math.round(15 * scale),
    padding: Math.round(20 * scale),
    borderRadius: Math.round(10 * scale),
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  shopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Math.round(15 * scale),
    gap: Math.round(10 * scale),
  },
  shopName: {
    fontSize: Math.round(18 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  shopStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Math.round(15 * scale),
  },
  shopStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Math.round(5 * scale),
  },
  shopStatText: {
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
  },
  shopStatus: {
    paddingHorizontal: Math.round(12 * scale),
    paddingVertical: Math.round(4 * scale),
    borderRadius: Math.round(12 * scale),
    marginLeft: 'auto',
  },
  shopOpen: {
    backgroundColor: `${colors.success}20`,
  },
  shopClosed: {
    backgroundColor: `${colors.error}20`,
  },
  shopStatusText: {
    fontSize: Math.round(12 * scale),
    fontWeight: 'bold',
  },
  menuSection: {
    backgroundColor: colors.surface,
    marginHorizontal: Math.round(15 * scale),
    borderRadius: Math.round(10 * scale),
    overflow: 'hidden',
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Math.round(15 * scale),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuIcon: {
    width: Math.round(48 * scale),
    height: Math.round(48 * scale),
    borderRadius: Math.round(24 * scale),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Math.round(15 * scale),
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: Math.round(16 * scale),
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: Math.round(2 * scale),
  },
  menuSubtitle: {
    fontSize: Math.round(12 * scale),
    color: colors.textTertiary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    margin: Math.round(15 * scale),
    padding: Math.round(15 * scale),
    borderRadius: Math.round(10 * scale),
    gap: Math.round(10 * scale),
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  logoutText: {
    fontSize: Math.round(16 * scale),
    fontWeight: 'bold',
    color: colors.error,
  },
  footer: {
    alignItems: 'center',
    padding: Math.round(20 * scale),
  },
  footerText: {
    fontSize: Math.round(12 * scale),
    color: colors.textTertiary,
    marginTop: Math.round(2 * scale),
  },
});
