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
import { useSelector, useDispatch } from 'react-redux';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import { logout } from '../store/authSlice';
import { useTheme } from '../theme';
import useResponsive from '../hooks/useResponsive';

const ProfileScreen = ({ navigation }) => {
  const { colors, typography } = useTheme();
  const { scale } = useResponsive();
  const dispatch = useDispatch();
  const { user, deliveryAddress } = useSelector((state) => state.auth);
  const { orders } = useSelector((state) => state.order);

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            dispatch(logout());
            // Clear navigation stack and go to auth
            navigation.reset({
              index: 0,
              routes: [{ name: 'Auth' }],
            });
          },
        },
      ]
    );
  };

  const menuItems = [
    {
      section: 'Account',
      items: [
        { icon: 'account-edit', title: 'Edit Profile', subtitle: 'Update your personal information', onPress: () => navigation.navigate('EditProfile') },
        { icon: 'map-marker-outline', title: 'Delivery Addresses', subtitle: 'Manage your delivery locations', onPress: () => navigation.navigate('Address') },
        { icon: 'credit-card-outline', title: 'Payment Methods', subtitle: 'Manage your payment options', onPress: () => navigation.navigate('Payment') },
        { icon: 'bell-outline', title: 'Notifications', subtitle: 'Manage your notification preferences', onPress: () => {} },
      ],
    },
    {
      section: 'Support',
      items: [
        { icon: 'help-circle-outline', title: 'Help Center', subtitle: 'Get help and support', onPress: () => {} },
        { icon: 'message-text-outline', title: 'Contact Us', subtitle: 'Reach out to our support team', onPress: () => {} },
        { icon: 'star-outline', title: 'Rate the App', subtitle: 'Share your feedback', onPress: () => {} },
        { icon: 'information-outline', title: 'About', subtitle: 'App version and information', onPress: () => {} },
      ],
    },
  ];

  const renderHeader = () => (
    <View style={s.header}>
      <View style={s.profileInfo}>
        <Image
          source={{ uri: user?.profileImage || 'https://via.placeholder.com/80' }}
          style={s.profileImage}
        />
        <View style={s.userInfo}>
          <Text style={s.userName}>{user?.name || 'User'}</Text>
          <Text style={s.userEmail}>{user?.email || 'user@example.com'}</Text>
          <Text style={s.userPhone}>{user?.phone || '+1 234 567 8900'}</Text>
        </View>
        <TouchableOpacity
          style={s.editButton}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Icon name="pencil" size={18} color={colors.accent} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStats = () => (
    <View style={s.statsContainer}>
      <View style={s.statItem}>
        <Text style={s.statNumber}>{String(orders.length)}</Text>
        <Text style={s.statLabel}>Orders</Text>
      </View>
      <View style={s.statDivider} />
      <View style={s.statItem}>
        <Text style={s.statNumber}>0</Text>
        <Text style={s.statLabel}>Favorites</Text>
      </View>
      <View style={s.statDivider} />
      <View style={s.statItem}>
        <Text style={s.statNumber}>0</Text>
        <Text style={s.statLabel}>Reviews</Text>
      </View>
    </View>
  );

  const renderMenuSection = ({ section, items }) => (
    <View style={s.menuSection}>
      <Text style={s.menuSectionTitle}>{section}</Text>
      {items.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={s.menuItem}
          onPress={item.onPress}
        >
          <View style={s.menuItemIcon}>
            <Icon name={item.icon} size={24} color={colors.accent} />
          </View>
          <View style={s.menuItemContent}>
            <Text style={s.menuItemTitle}>{item.title}</Text>
            <Text style={s.menuItemSubtitle}>{item.subtitle}</Text>
          </View>
          <Icon name="chevron-right" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderSignOut = () => (
    <TouchableOpacity style={s.signOutButton} onPress={handleLogout}>
      <Icon name="logout" size={24} color={colors.error} />
      <Text style={s.signOutText}>Sign Out</Text>
    </TouchableOpacity>
  );
  const s = styles(colors, typography, scale);


  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Profile</Text>
        <TouchableOpacity>
          <Icon name="cog-outline" size={24} color={colors.accent} />
        </TouchableOpacity>
      </View>

      <ScrollView style={s.content} showsVerticalScrollIndicator={false}>
        {renderHeader()}
        {renderStats()}
        
        {menuItems.map((section, index) => (
          <View key={index}>
            {renderMenuSection(section)}
            {index < menuItems.length - 1 && <View style={s.sectionDivider} />}
          </View>
        ))}
        
        {renderSignOut()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = (colors, typography, scale = 1) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Math.round(16 * scale),
    paddingVertical: Math.round(12 * scale),
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: Math.round(20 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  content: {
    flex: 1,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  profileImage: {
    width: Math.round(80 * scale),
    height: Math.round(80 * scale),
    borderRadius: Math.round(40 * scale),
    marginRight: Math.round(16 * scale),
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: Math.round(20 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: Math.round(4 * scale),
  },
  userEmail: {
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
    marginBottom: Math.round(2 * scale),
  },
  userPhone: {
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
  },
  editButton: {
    width: Math.round(36 * scale),
    height: Math.round(36 * scale),
    borderRadius: Math.round(18 * scale),
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    marginHorizontal: Math.round(16 * scale),
    marginVertical: Math.round(16 * scale),
    borderRadius: Math.round(12 * scale),
    paddingVertical: Math.round(20 * scale),
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: Math.round(24 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: Math.round(4 * scale),
  },
  statLabel: {
    fontSize: Math.round(12 * scale),
    color: colors.textSecondary,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  menuSection: {
    marginTop: Math.round(24 * scale),
  },
  menuSectionTitle: {
    fontSize: Math.round(16 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: Math.round(12 * scale),
    paddingHorizontal: Math.round(16 * scale),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Math.round(16 * scale),
    paddingHorizontal: Math.round(16 * scale),
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  menuItemIcon: {
    width: Math.round(40 * scale),
    height: Math.round(40 * scale),
    borderRadius: Math.round(20 * scale),
    backgroundColor: colors.accentSurface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Math.round(16 * scale),
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: Math.round(16 * scale),
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: Math.round(2 * scale),
  },
  menuItemSubtitle: {
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: Math.round(16 * scale),
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Math.round(16 * scale),
    marginHorizontal: Math.round(16 * scale),
    marginVertical: Math.round(24 * scale),
    backgroundColor: colors.dangerSurface,
    borderRadius: Math.round(12 * scale),
    borderWidth: 1,
    borderColor: colors.dangerBorder,
  },
  signOutText: {
    fontSize: Math.round(16 * scale),
    fontWeight: '600',
    color: colors.error,
    marginLeft: Math.round(8 * scale),
  },
});

export default ProfileScreen;