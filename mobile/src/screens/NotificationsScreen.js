import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme';
import useResponsive from '../hooks/useResponsive';

const NotificationsScreen = ({ navigation }) => {
  const { colors, typography } = useTheme();
  const { scale } = useResponsive();
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: '1',
      title: 'Order Booked',
      body: 'Your order #12345 has been confirmed',
      time: '5 min ago',
      read: false,
      type: 'order',
    },
    {
      id: '2',
      title: 'Order Delivered',
      body: 'Your order #12344 has been delivered successfully',
      time: '1 hour ago',
      read: false,
      type: 'order',
    },
    {
      id: '3',
      title: '50% Off Today!',
      body: 'Get 50% discount on all products. Limited time offer!',
      time: '2 hours ago',
      read: true,
      type: 'promotion',
    },
  ]);

  // Mark all as read when screen opens
  useEffect(() => {
    const markAsVisited = async () => {
      try {
        // Mark all notifications as read
        setNotifications(notifications.map(n => ({ ...n, read: true })));
        
        // Save to AsyncStorage that user has visited
        await AsyncStorage.setItem('notificationsVisited', 'true');
      } catch (error) {
        console.log('Error marking notifications as visited:', error);
      }
    };

    markAsVisited();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const deleteNotification = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const getNotificationIcon = (title, body) => {
    const text = `${title} ${body}`.toLowerCase();
    
    if (text.includes('order') || text.includes('delivery') || text.includes('delivered') || text.includes('booked')) {
      return { icon: 'package-variant', color: colors.info };
    }
    if (text.includes('discount') || text.includes('offer') || text.includes('sale')) {
      return { icon: 'tag', color: colors.accent };
    }
    if (text.includes('confirmed')) {
      return { icon: 'check-circle', color: colors.success };
    }
    return { icon: 'bell', color: colors.accent };
  };

  const getTimeAgo = (timeStr) => {
    return timeStr;
  };

  const renderNotification = ({ item }) => {
    const iconData = getNotificationIcon(item.title, item.body);
    
    return (
      <TouchableOpacity
        style={[s.notificationCard, !item.read && s.unreadCard]}
        onPress={() => {
          if (item.type === 'order') {
            navigation.navigate('Orders');
          }
        }}
        activeOpacity={0.7}
      >
        <View style={[s.iconContainer, { backgroundColor: `${iconData.color}15` }]}>
          <Icon name={iconData.icon} size={24} color={iconData.color} />
        </View>

        <View style={s.notificationContent}>
          <View style={s.notificationHeader}>
            <Text style={s.notificationTitle}>{item.title}</Text>
            {!item.read && <View style={s.unreadDot} />}
          </View>
          <Text style={s.notificationMessage} numberOfLines={2}>
            {item.body}
          </Text>
          <Text style={s.notificationTime}>{item.time}</Text>
        </View>

        <TouchableOpacity
          style={s.deleteButton}
          onPress={() => deleteNotification(item.id)}
        >
          <Icon name="close" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const s = styles(colors, typography, scale);

  const renderHeader = () => (
    <View style={s.header}>
      <TouchableOpacity
        style={s.backButton}
        onPress={() => navigation.goBack()}
      >
        <Icon name="arrow-left" size={24} color={colors.textPrimary} />
      </TouchableOpacity>

      <View style={s.headerCenter}>
        <Text style={s.headerTitle}>Notifications</Text>
      </View>

      <View style={{ width: 40 }} />
    </View>
  );

  const renderEmpty = () => (
    <View style={s.emptyContainer}>
      <Icon name="bell-off-outline" size={80} color={colors.border} />
      <Text style={s.emptyTitle}>No Notifications</Text>
      <Text style={s.emptyMessage}>
        You're all caught up! Check back later for updates.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={s.container}>
      {renderHeader()}

      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={s.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.accent]}
          />
        }
        ListEmptyComponent={renderEmpty()}
      />
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Math.round(16 * scale),
    paddingVertical: Math.round(16 * scale),
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: Math.round(40 * scale),
    height: Math.round(40 * scale),
    borderRadius: Math.round(20 * scale),
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: Math.round(16 * scale),
  },
  headerTitle: {
    fontSize: Math.round(20 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  listContainer: {
    padding: Math.round(16 * scale),
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: Math.round(16 * scale),
    padding: Math.round(16 * scale),
    marginBottom: Math.round(12 * scale),
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
    backgroundColor: colors.surfaceVariant,
  },
  iconContainer: {
    width: Math.round(48 * scale),
    height: Math.round(48 * scale),
    borderRadius: Math.round(24 * scale),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Math.round(12 * scale),
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Math.round(4 * scale),
  },
  notificationTitle: {
    fontSize: Math.round(16 * scale),
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  unreadDot: {
    width: Math.round(8 * scale),
    height: Math.round(8 * scale),
    borderRadius: Math.round(4 * scale),
    backgroundColor: colors.accent,
    marginLeft: Math.round(8 * scale),
  },
  notificationMessage: {
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
    lineHeight: Math.round(20 * scale),
    marginBottom: Math.round(8 * scale),
  },
  notificationTime: {
    fontSize: Math.round(12 * scale),
    color: colors.textTertiary,
  },
  deleteButton: {
    width: Math.round(32 * scale),
    height: Math.round(32 * scale),
    borderRadius: Math.round(16 * scale),
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Math.round(8 * scale),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Math.round(80 * scale),
  },
  emptyTitle: {
    fontSize: Math.round(20 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: Math.round(16 * scale),
    marginBottom: Math.round(8 * scale),
  },
  emptyMessage: {
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Math.round(32 * scale),
  },
});

export default NotificationsScreen;
