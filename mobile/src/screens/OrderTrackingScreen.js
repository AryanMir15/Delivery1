import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useQuery } from '@apollo/client';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { GET_ORDER } from '../api/queries';
import { formatDate } from '../utils/dateFormatter';

const ORDER_STATUSES = [
  { key: 'pending', label: 'Order Placed', icon: 'check-circle' },
  { key: 'accepted', label: 'Accepted', icon: 'store-check' },
  { key: 'assigned', label: 'Rider Assigned', icon: 'bike' },
  { key: 'picked', label: 'Picked Up', icon: 'package-variant' },
  { key: 'delivered', label: 'Delivered', icon: 'check-all' },
];

const OrderTrackingScreen = ({ navigation, route }) => {
  const { orderId } = route.params;
  const [riderLocation, setRiderLocation] = useState(null);

  const { data, loading, refetch } = useQuery(GET_ORDER, {
    variables: { id: orderId },
    pollInterval: 10000, // Poll every 10 seconds for updates
  });

  const order = data?.order;

  useEffect(() => {
    // Simulate rider location updates
    // In production, this would come from WebSocket subscription
    if (order?.rider && order.orderStatus !== 'delivered') {
      const interval = setInterval(() => {
        setRiderLocation({
          latitude: 37.78825 + Math.random() * 0.01,
          longitude: -122.4324 + Math.random() * 0.01,
        });
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [order]);

  const getStatusIndex = (status) => {
    return ORDER_STATUSES.findIndex((s) => s.key === status);
  };

  const currentStatusIndex = getStatusIndex(order?.orderStatus || 'pending');

  const handleCall = (phoneNumber) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleMessage = (phoneNumber) => {
    Linking.openURL(`sms:${phoneNumber}`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Icon name="arrow-left" size={24} color="#1D3557" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Order #{order?.orderId}</Text>
          <Text style={styles.headerSubtitle}>
            {formatDate(order?.orderDate || order?.createdAt)}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => refetch()}
        >
          <Icon name="refresh" size={24} color="#1D3557" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Map View */}
        {order?.orderStatus !== 'delivered' && order?.orderStatus !== 'cancelled' && (
          <View style={styles.mapContainer}>
            <MapView
              provider={PROVIDER_DEFAULT}
              style={styles.map}
              initialRegion={{
                latitude: 37.78825,
                longitude: -122.4324,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
              }}
            >
              {/* Restaurant Marker */}
              <Marker
                coordinate={{
                  latitude: 37.78825,
                  longitude: -122.4324,
                }}
                title={order?.restaurant?.name}
              >
                <View style={styles.markerContainer}>
                  <Icon name="store" size={24} color="#FF6B35" />
                </View>
              </Marker>

              {/* Rider Marker */}
              {riderLocation && (
                <Marker
                  coordinate={riderLocation}
                  title="Delivery Rider"
                >
                  <View style={styles.markerContainer}>
                    <Icon name="bike" size={24} color="#4CAF50" />
                  </View>
                </Marker>
              )}

              {/* Customer Marker */}
              <Marker
                coordinate={{
                  latitude: 37.79825,
                  longitude: -122.4424,
                }}
                title="Your Location"
              >
                <View style={styles.markerContainer}>
                  <Icon name="map-marker" size={24} color="#2196F3" />
                </View>
              </Marker>

              {/* Route Polyline */}
              {riderLocation && (
                <Polyline
                  coordinates={[
                    riderLocation,
                    { latitude: 37.79825, longitude: -122.4424 },
                  ]}
                  strokeColor="#FF6B35"
                  strokeWidth={3}
                />
              )}
            </MapView>

            {/* ETA Card */}
            <View style={styles.etaCard}>
              <Icon name="clock-fast" size={24} color="#FF6B35" />
              <View style={styles.etaInfo}>
                <Text style={styles.etaLabel}>Estimated Arrival</Text>
                <Text style={styles.etaTime}>
                  {order?.expectedTime || '25-30 min'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Order Status Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Status</Text>
          <View style={styles.timeline}>
            {ORDER_STATUSES.map((status, index) => {
              const isCompleted = index <= currentStatusIndex;
              const isCurrent = index === currentStatusIndex;

              return (
                <View key={status.key} style={styles.timelineItem}>
                  <View style={styles.timelineLeft}>
                    <View
                      style={[
                        styles.timelineIcon,
                        isCompleted && styles.timelineIconCompleted,
                        isCurrent && styles.timelineIconCurrent,
                      ]}
                    >
                      <Icon
                        name={status.icon}
                        size={20}
                        color={isCompleted ? '#FFFFFF' : '#6C757D'}
                      />
                    </View>
                    {index < ORDER_STATUSES.length - 1 && (
                      <View
                        style={[
                          styles.timelineLine,
                          isCompleted && styles.timelineLineCompleted,
                        ]}
                      />
                    )}
                  </View>
                  <View style={styles.timelineRight}>
                    <Text
                      style={[
                        styles.timelineLabel,
                        isCompleted && styles.timelineLabelCompleted,
                      ]}
                    >
                      {status.label}
                    </Text>
                    {isCompleted && (
                      <Text style={styles.timelineTime}>
                        {new Date().toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Rider Info */}
        {order?.rider && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Rider</Text>
            <View style={styles.riderCard}>
              <Image
                source={{
                  uri: order.rider.profileImage || 'https://via.placeholder.com/60',
                }}
                style={styles.riderImage}
              />
              <View style={styles.riderInfo}>
                <Text style={styles.riderName}>{order.rider.name}</Text>
                <View style={styles.riderMeta}>
                  <Icon name="star" size={16} color="#FFC107" />
                  <Text style={styles.riderRating}>4.8</Text>
                  <Text style={styles.riderVehicle}>
                    • {order.rider.vehicleType || 'Bike'}
                  </Text>
                </View>
              </View>
              <View style={styles.riderActions}>
                <TouchableOpacity
                  style={styles.riderActionButton}
                  onPress={() => handleCall(order.rider.phone)}
                >
                  <Icon name="phone" size={20} color="#FF6B35" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.riderActionButton}
                  onPress={() => handleMessage(order.rider.phone)}
                >
                  <Icon name="message" size={20} color="#FF6B35" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Restaurant Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Restaurant</Text>
          <View style={styles.restaurantCard}>
            <Image
              source={{
                uri: order?.restaurant?.image || 'https://via.placeholder.com/60',
              }}
              style={styles.restaurantImage}
            />
            <View style={styles.restaurantInfo}>
              <Text style={styles.restaurantName}>{order?.restaurant?.name}</Text>
              <Text style={styles.restaurantAddress} numberOfLines={1}>
                {order?.restaurant?.address}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.callButton}
              onPress={() => handleCall(order?.restaurant?.phone)}
            >
              <Icon name="phone" size={20} color="#FF6B35" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          {order?.items?.map((item, index) => (
            <View key={index} style={styles.orderItem}>
              <Text style={styles.itemQuantity}>{`${item.quantity}x`}</Text>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.title}</Text>
                {item.variation && (
                  <Text style={styles.itemVariation}>{item.variation.title}</Text>
                )}
              </View>
              <Text style={styles.itemPrice}>
                ETB {(item.variation?.price * item.quantity).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        {/* Delivery Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          <View style={styles.addressCard}>
            <Icon name="map-marker" size={24} color="#FF6B35" />
            <View style={styles.addressInfo}>
              <Text style={styles.addressLabel}>
                {order?.deliveryAddress?.label || 'Home'}
              </Text>
              <Text style={styles.addressText}>
                {order?.deliveryAddress?.deliveryAddress}
              </Text>
              {order?.deliveryAddress?.details && (
                <Text style={styles.addressDetails}>
                  {order.deliveryAddress.details}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Bill Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill Summary</Text>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Subtotal</Text>
            <Text style={styles.billValue}>{'ETB ' + String(order?.orderAmount?.toFixed(2) || '0.00')}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery Fee</Text>
            <Text style={styles.billValue}>
              ETB {order?.deliveryCharges?.toFixed(2)}
            </Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Tax</Text>
            <Text style={styles.billValue}>
              ETB {order?.taxationAmount?.toFixed(2)}
            </Text>
          </View>
          {order?.tipping > 0 && (
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Tip</Text>
              <Text style={styles.billValue}>{'ETB ' + String(order.tipping.toFixed(2))}</Text>
            </View>
          )}
          <View style={styles.dividerLine} />
          <View style={styles.billRow}>
            <Text style={styles.billTotal}>Total Paid</Text>
            <Text style={styles.billTotalValue}>
              ETB {order?.paidAmount?.toFixed(2) || order?.orderAmount?.toFixed(2)}
            </Text>
          </View>
          <View style={styles.paymentMethod}>
            <Icon name="cash" size={16} color="#6C757D" />
            <Text style={styles.paymentMethodText}>
              {order?.paymentMethod?.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        {order?.orderStatus !== 'delivered' && order?.orderStatus !== 'cancelled' && (
          <View style={styles.section}>
            <TouchableOpacity style={styles.helpButton}>
              <Icon name="help-circle-outline" size={20} color="#FF6B35" />
              <Text style={styles.helpButtonText}>Need Help?</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton}>
              <Icon name="close-circle-outline" size={20} color="#E63946" />
              <Text style={styles.cancelButtonText}>Cancel Order</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Rate Order (if delivered) */}
        {order?.orderStatus === 'delivered' && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.rateButton}
              onPress={() =>
                navigation.navigate('RateOrder', { orderId: order._id })
              }
            >
              <Icon name="star-outline" size={20} color="#FFFFFF" />
              <Text style={styles.rateButtonText}>Rate Your Order</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
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
  headerInfo: {
    flex: 1,
    marginLeft: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1D3557',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6C757D',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapContainer: {
    height: 250,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  etaCard: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  etaInfo: {
    marginLeft: 12,
  },
  etaLabel: {
    fontSize: 12,
    color: '#6C757D',
  },
  etaTime: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1D3557',
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1D3557',
    marginBottom: 16,
  },
  timeline: {
    paddingLeft: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  timelineLeft: {
    alignItems: 'center',
    marginRight: 16,
  },
  timelineIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E9ECEF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineIconCompleted: {
    backgroundColor: '#4CAF50',
  },
  timelineIconCurrent: {
    backgroundColor: '#FF6B35',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E9ECEF',
    marginTop: 8,
  },
  timelineLineCompleted: {
    backgroundColor: '#4CAF50',
  },
  timelineRight: {
    flex: 1,
    paddingTop: 8,
  },
  timelineLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6C757D',
  },
  timelineLabelCompleted: {
    color: '#1D3557',
  },
  timelineTime: {
    fontSize: 14,
    color: '#6C757D',
    marginTop: 4,
  },
  riderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  riderImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E9ECEF',
  },
  riderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  riderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D3557',
    marginBottom: 4,
  },
  riderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  riderRating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1D3557',
    marginLeft: 4,
  },
  riderVehicle: {
    fontSize: 14,
    color: '#6C757D',
  },
  riderActions: {
    flexDirection: 'row',
  },
  riderActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  restaurantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  restaurantImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#E9ECEF',
  },
  restaurantInfo: {
    flex: 1,
    marginLeft: 12,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D3557',
    marginBottom: 4,
  },
  restaurantAddress: {
    fontSize: 14,
    color: '#6C757D',
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  itemQuantity: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B35',
    width: 40,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    color: '#1D3557',
  },
  itemVariation: {
    fontSize: 14,
    color: '#6C757D',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D3557',
  },
  addressCard: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  addressInfo: {
    flex: 1,
    marginLeft: 12,
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B35',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 16,
    color: '#1D3557',
    marginBottom: 4,
  },
  addressDetails: {
    fontSize: 14,
    color: '#6C757D',
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  billLabel: {
    fontSize: 14,
    color: '#6C757D',
  },
  billValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1D3557',
  },
  dividerLine: {
    height: 1,
    backgroundColor: '#E9ECEF',
    marginVertical: 12,
  },
  billTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1D3557',
  },
  billTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  paymentMethodText: {
    fontSize: 14,
    color: '#6C757D',
    marginLeft: 6,
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FF6B35',
    marginBottom: 12,
  },
  helpButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B35',
    marginLeft: 8,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E63946',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E63946',
    marginLeft: 8,
  },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    borderRadius: 12,
  },
  rateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});

export default OrderTrackingScreen;
