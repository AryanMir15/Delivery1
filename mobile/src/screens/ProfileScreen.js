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

const ProfileScreen = ({ navigation }) => {
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
    <View style={styles.header}>
      <View style={styles.profileInfo}>
        <Image
          source={{ uri: user?.profileImage || 'https://via.placeholder.com/80' }}
          style={styles.profileImage}
        />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
          <Text style={styles.userPhone}>{user?.phone || '+1 234 567 8900'}</Text>
        </View>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Icon name="pencil" size={18} color="#FF6B35" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>{String(orders.length)}</Text>
        <Text style={styles.statLabel}>Orders</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>0</Text>
        <Text style={styles.statLabel}>Favorites</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>0</Text>
        <Text style={styles.statLabel}>Reviews</Text>
      </View>
    </View>
  );

  const renderMenuSection = ({ section, items }) => (
    <View style={styles.menuSection}>
      <Text style={styles.menuSectionTitle}>{section}</Text>
      {items.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={styles.menuItem}
          onPress={item.onPress}
        >
          <View style={styles.menuItemIcon}>
            <Icon name={item.icon} size={24} color="#FF6B35" />
          </View>
          <View style={styles.menuItemContent}>
            <Text style={styles.menuItemTitle}>{item.title}</Text>
            <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
          </View>
          <Icon name="chevron-right" size={24} color="#6C757D" />
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderSignOut = () => (
    <TouchableOpacity style={styles.signOutButton} onPress={handleLogout}>
      <Icon name="logout" size={24} color="#E63946" />
      <Text style={styles.signOutText}>Sign Out</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity>
          <Icon name="cog-outline" size={24} color="#FF6B35" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderHeader()}
        {renderStats()}
        
        {menuItems.map((section, index) => (
          <View key={index}>
            {renderMenuSection(section)}
            {index < menuItems.length - 1 && <View style={styles.sectionDivider} />}
          </View>
        ))}
        
        {renderSignOut()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1D3557',
  },
  content: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    backgroundColor: '#F8F9FA',
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1D3557',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 14,
    color: '#6C757D',
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 12,
    paddingVertical: 20,
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
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1D3557',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6C757D',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E9ECEF',
  },
  menuSection: {
    marginTop: 24,
  },
  menuSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1D3557',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D3557',
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 14,
    color: '#6C757D',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#E9ECEF',
    marginHorizontal: 16,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginHorizontal: 16,
    marginVertical: 24,
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FED7D7',
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E63946',
    marginLeft: 8,
  },
});

export default ProfileScreen;