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

const NotificationsScreen = ({ navigation }) => {
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
      return { icon: 'package-variant', color: '#2196F3' };
    }
    if (text.includes('discount') || text.includes('offer') || text.includes('sale')) {
      return { icon: 'tag', color: '#FF6B35' };
    }
    if (text.includes('confirmed')) {
      return { icon: 'check-circle', color: '#4CAF50' };
    }
    return { icon: 'bell', color: '#9C27B0' };
  };

  const getTimeAgo = (timeStr) => {
    return timeStr;
  };

  const renderNotification = ({ item }) => {
    const iconData = getNotificationIcon(item.title, item.body);
    
    return (
      <TouchableOpacity
        style={[styles.notificationCard, !item.read && styles.unreadCard]}
        onPress={() => {
          if (item.type === 'order') {
            navigation.navigate('Orders');
          }
        }}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${iconData.color}15` }]}>
          <Icon name={iconData.icon} size={24} color={iconData.color} />
        </View>

        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <Text style={styles.notificationTitle}>{item.title}</Text>
            {!item.read && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.notificationMessage} numberOfLines={2}>
            {item.body}
          </Text>
          <Text style={styles.notificationTime}>{item.time}</Text>
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteNotification(item.id)}
        >
          <Icon name="close" size={20} color="#6C757D" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Icon name="arrow-left" size={24} color="#1D3557" />
      </TouchableOpacity>

      <View style={styles.headerCenter}>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>

      <View style={{ width: 40 }} />
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Icon name="bell-off-outline" size={80} color="#E9ECEF" />
      <Text style={styles.emptyTitle}>No Notifications</Text>
      <Text style={styles.emptyMessage}>
        You're all caught up! Check back later for updates.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}

      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF6B35']}
          />
        }
        ListEmptyComponent={renderEmpty()}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1D3557',
  },
  listContainer: {
    padding: 16,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B35',
    backgroundColor: '#FFF9F5',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D3557',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B35',
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#6C757D',
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: '#ADB5BD',
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1D3557',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});

export default NotificationsScreen;
