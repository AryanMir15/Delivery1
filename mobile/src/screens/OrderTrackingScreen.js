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
import { useTheme } from '../theme';
import useResponsive from '../hooks/useResponsive';

const ORDER_STATUSES = [
  { key: 'pending', label: 'Order Placed', icon: 'check-circle' },
  { key: 'accepted', label: 'Accepted', icon: 'store-check' },
  { key: 'assigned', label: 'Rider Assigned', icon: 'bike' },
  { key: 'picked', label: 'Picked Up', icon: 'package-variant' },
  { key: 'delivered', label: 'Delivered', icon: 'check-all' },
];

const OrderTrackingScreen = ({ navigation, route }) => {
  const { colors, typography } = useTheme();
  const { scale } = useResponsive();
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

  const s = styles(colors, typography, scale);

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
      <View style={s.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity
          style={s.backButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Icon name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={s.headerInfo}>
          <Text style={s.headerTitle}>Order #{order?.orderId}</Text>
          <Text style={s.headerSubtitle}>
            {formatDate(order?.orderDate || order?.createdAt)}
          </Text>
        </View>
        <TouchableOpacity
          style={s.refreshButton}
          onPress={() => refetch()}
        >
          <Icon name="refresh" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Map View */}
        {order?.orderStatus !== 'delivered' && order?.orderStatus !== 'cancelled' && (
          <View style={s.mapContainer}>
            <MapView
              provider={PROVIDER_DEFAULT}
              style={s.map}
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
                <View style={s.markerContainer}>
                  <Icon name="store" size={24} color={colors.accent} />
                </View>
              </Marker>

              {/* Rider Marker */}
              {riderLocation && (
                <Marker
                  coordinate={riderLocation}
                  title="Delivery Rider"
                >
                  <View style={s.markerContainer}>
                    <Icon name="bike" size={24} color={colors.accent} />
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
                <View style={s.markerContainer}>
                  <Icon name="map-marker" size={24} color={colors.info} />
                </View>
              </Marker>

              {/* Route Polyline */}
              {riderLocation && (
                <Polyline
                  coordinates={[
                    riderLocation,
                    { latitude: 37.79825, longitude: -122.4424 },
                  ]}
                  strokeColor={colors.accent}
                  strokeWidth={3}
                />
              )}
            </MapView>

            {/* ETA Card */}
            <View style={s.etaCard}>
              <Icon name="clock-fast" size={24} color={colors.accent} />
              <View style={s.etaInfo}>
                <Text style={s.etaLabel}>Estimated Arrival</Text>
                <Text style={s.etaTime}>
                  {order?.expectedTime || '25-30 min'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Order Status Timeline */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Order Status</Text>
          <View style={s.timeline}>
            {ORDER_STATUSES.map((status, index) => {
              const isCompleted = index <= currentStatusIndex;
              const isCurrent = index === currentStatusIndex;

              return (
                <View key={status.key} style={s.timelineItem}>
                  <View style={s.timelineLeft}>
                    <View
                      style={[
                        s.timelineIcon,
                        isCompleted && s.timelineIconCompleted,
                        isCurrent && s.timelineIconCurrent,
                      ]}
                    >
                      <Icon
                        name={status.icon}
                        size={20}
                        color={isCompleted ? colors.textInverse : colors.textSecondary}
                      />
                    </View>
                    {index < ORDER_STATUSES.length - 1 && (
                      <View
                        style={[
                          s.timelineLine,
                          isCompleted && s.timelineLineCompleted,
                        ]}
                      />
                    )}
                  </View>
                  <View style={s.timelineRight}>
                    <Text
                      style={[
                        s.timelineLabel,
                        isCompleted && s.timelineLabelCompleted,
                      ]}
                    >
                      {status.label}
                    </Text>
                    {isCompleted && (
                      <Text style={s.timelineTime}>
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
          <View style={s.section}>
            <Text style={s.sectionTitle}>Delivery Rider</Text>
            <View style={s.riderCard}>
              <Image
                source={{
                  uri: order.rider.profileImage || 'https://via.placeholder.com/60',
                }}
                style={s.riderImage}
              />
              <View style={s.riderInfo}>
                <Text style={s.riderName}>{order.rider.name}</Text>
                <View style={s.riderMeta}>
                  <Icon name="star" size={16} color={colors.warning} />
                  <Text style={s.riderRating}>4.8</Text>
                  <Text style={s.riderVehicle}>
                    • {order.rider.vehicleType || 'Bike'}
                  </Text>
                </View>
              </View>
              <View style={s.riderActions}>
                <TouchableOpacity
                  style={s.riderActionButton}
                  onPress={() => handleCall(order.rider.phone)}
                >
                  <Icon name="phone" size={20} color={colors.accent} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.riderActionButton}
                  onPress={() => handleMessage(order.rider.phone)}
                >
                  <Icon name="message" size={20} color={colors.accent} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Restaurant Info */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Restaurant</Text>
          <View style={s.restaurantCard}>
            <Image
              source={{
                uri: order?.restaurant?.image || 'https://via.placeholder.com/60',
              }}
              style={s.restaurantImage}
            />
            <View style={s.restaurantInfo}>
              <Text style={s.restaurantName}>{order?.restaurant?.name}</Text>
              <Text style={s.restaurantAddress} numberOfLines={1}>
                {order?.restaurant?.address}
              </Text>
            </View>
            <TouchableOpacity
              style={s.callButton}
              onPress={() => handleCall(order?.restaurant?.phone)}
            >
              <Icon name="phone" size={20} color={colors.accent} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Order Items */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Order Items</Text>
          {order?.items?.map((item, index) => (
            <View key={index} style={s.orderItem}>
              <Text style={s.itemQuantity}>{`${item.quantity}x`}</Text>
              <View style={s.itemInfo}>
                <Text style={s.itemName}>{item.title}</Text>
                {item.variation && (
                  <Text style={s.itemVariation}>{item.variation.title}</Text>
                )}
              </View>
              <Text style={s.itemPrice}>
                PKR {(item.variation?.price * item.quantity).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        {/* Delivery Address */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Delivery Address</Text>
          <View style={s.addressCard}>
            <Icon name="map-marker" size={24} color={colors.accent} />
            <View style={s.addressInfo}>
              <Text style={s.addressLabel}>
                {order?.deliveryAddress?.label || 'Home'}
              </Text>
              <Text style={s.addressText}>
                {order?.deliveryAddress?.deliveryAddress}
              </Text>
              {order?.deliveryAddress?.details && (
                <Text style={s.addressDetails}>
                  {order.deliveryAddress.details}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Bill Summary */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Bill Summary</Text>
          <View style={s.billRow}>
            <Text style={s.billLabel}>Subtotal</Text>
            <Text style={s.billValue}>{'PKR ' + String(order?.orderAmount?.toFixed(2) || '0.00')}</Text>
          </View>
          <View style={s.billRow}>
            <Text style={s.billLabel}>Delivery Fee</Text>
            <Text style={s.billValue}>
              PKR {order?.deliveryCharges?.toFixed(2)}
            </Text>
          </View>
          <View style={s.billRow}>
            <Text style={s.billLabel}>Tax</Text>
            <Text style={s.billValue}>
              PKR {order?.taxationAmount?.toFixed(2)}
            </Text>
          </View>
          {order?.tipping > 0 && (
            <View style={s.billRow}>
              <Text style={s.billLabel}>Tip</Text>
              <Text style={s.billValue}>{'PKR ' + String(order.tipping.toFixed(2))}</Text>
            </View>
          )}
          <View style={s.dividerLine} />
          <View style={s.billRow}>
            <Text style={s.billTotal}>Total Paid</Text>
            <Text style={s.billTotalValue}>
              PKR {order?.paidAmount?.toFixed(2) || order?.orderAmount?.toFixed(2)}
            </Text>
          </View>
          <View style={s.paymentMethod}>
            <Icon name="cash" size={16} color={colors.textSecondary} />
            <Text style={s.paymentMethodText}>
              {order?.paymentMethod?.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        {order?.orderStatus !== 'delivered' && order?.orderStatus !== 'cancelled' && (
          <View style={s.section}>
            <TouchableOpacity style={s.helpButton}>
              <Icon name="help-circle-outline" size={20} color={colors.accent} />
              <Text style={s.helpButtonText}>Need Help?</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.cancelButton}>
              <Icon name="close-circle-outline" size={20} color={colors.error} />
              <Text style={s.cancelButtonText}>Cancel Order</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Rate Order (if delivered) */}
        {order?.orderStatus === 'delivered' && (
          <View style={s.section}>
            <TouchableOpacity
              style={s.rateButton}
              onPress={() =>
                navigation.navigate('RateOrder', { orderId: order._id })
              }
            >
              <Icon name="star-outline" size={20} color={colors.textInverse} />
              <Text style={s.rateButtonText}>Rate Your Order</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = (colors, typography, scale = 1) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Math.round(20 * scale),
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
  headerInfo: {
    flex: 1,
    marginLeft: Math.round(16 * scale),
  },
  headerTitle: {
    fontSize: Math.round(18 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
  },
  refreshButton: {
    width: Math.round(40 * scale),
    height: Math.round(40 * scale),
    borderRadius: Math.round(20 * scale),
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapContainer: {
    height: Math.round(250 * scale),
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    width: Math.round(40 * scale),
    height: Math.round(40 * scale),
    borderRadius: Math.round(20 * scale),
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  etaCard: {
    position: 'absolute',
    top: Math.round(16 * scale),
    left: Math.round(16 * scale),
    right: Math.round(16 * scale),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: Math.round(16 * scale),
    borderRadius: Math.round(12 * scale),
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  etaInfo: {
    marginLeft: Math.round(12 * scale),
  },
  etaLabel: {
    fontSize: Math.round(12 * scale),
    color: colors.textSecondary,
  },
  etaTime: {
    fontSize: Math.round(18 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  section: {
    backgroundColor: colors.surface,
    padding: Math.round(20 * scale),
    marginTop: Math.round(12 * scale),
  },
  sectionTitle: {
    fontSize: Math.round(16 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: Math.round(16 * scale),
  },
  timeline: {
    paddingLeft: Math.round(8 * scale),
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: Math.round(24 * scale),
  },
  timelineLeft: {
    alignItems: 'center',
    marginRight: Math.round(16 * scale),
  },
  timelineIcon: {
    width: Math.round(40 * scale),
    height: Math.round(40 * scale),
    borderRadius: Math.round(20 * scale),
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineIconCompleted: {
    backgroundColor: colors.success,
  },
  timelineIconCurrent: {
    backgroundColor: colors.accent,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.border,
    marginTop: Math.round(8 * scale),
  },
  timelineLineCompleted: {
    backgroundColor: colors.success,
  },
  timelineRight: {
    flex: 1,
    paddingTop: Math.round(8 * scale),
  },
  timelineLabel: {
    fontSize: Math.round(16 * scale),
    fontWeight: '600',
    color: colors.textSecondary,
  },
  timelineLabelCompleted: {
    color: colors.textPrimary,
  },
  timelineTime: {
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
    marginTop: Math.round(4 * scale),
  },
  riderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Math.round(16 * scale),
    backgroundColor: colors.surface,
    borderRadius: Math.round(12 * scale),
  },
  riderImage: {
    width: Math.round(60 * scale),
    height: Math.round(60 * scale),
    borderRadius: Math.round(30 * scale),
    backgroundColor: colors.border,
  },
  riderInfo: {
    flex: 1,
    marginLeft: Math.round(12 * scale),
  },
  riderName: {
    fontSize: Math.round(16 * scale),
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: Math.round(4 * scale),
  },
  riderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  riderRating: {
    fontSize: Math.round(14 * scale),
    fontWeight: '600',
    color: colors.textPrimary,
    marginLeft: Math.round(4 * scale),
  },
  riderVehicle: {
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
  },
  riderActions: {
    flexDirection: 'row',
  },
  riderActionButton: {
    width: Math.round(40 * scale),
    height: Math.round(40 * scale),
    borderRadius: Math.round(20 * scale),
    backgroundColor: colors.accentSurface,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Math.round(8 * scale),
  },
  restaurantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Math.round(16 * scale),
    backgroundColor: colors.surface,
    borderRadius: Math.round(12 * scale),
  },
  restaurantImage: {
    width: Math.round(60 * scale),
    height: Math.round(60 * scale),
    borderRadius: Math.round(12 * scale),
    backgroundColor: colors.border,
  },
  restaurantInfo: {
    flex: 1,
    marginLeft: Math.round(12 * scale),
  },
  restaurantName: {
    fontSize: Math.round(16 * scale),
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: Math.round(4 * scale),
  },
  restaurantAddress: {
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
  },
  callButton: {
    width: Math.round(40 * scale),
    height: Math.round(40 * scale),
    borderRadius: Math.round(20 * scale),
    backgroundColor: colors.accentSurface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Math.round(12 * scale),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemQuantity: {
    fontSize: Math.round(16 * scale),
    fontWeight: '600',
    color: colors.accent,
    width: Math.round(40 * scale),
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: Math.round(16 * scale),
    color: colors.textPrimary,
  },
  itemVariation: {
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
  },
  itemPrice: {
    fontSize: Math.round(16 * scale),
    fontWeight: '600',
    color: colors.textPrimary,
  },
  addressCard: {
    flexDirection: 'row',
    padding: Math.round(16 * scale),
    backgroundColor: colors.surface,
    borderRadius: Math.round(12 * scale),
  },
  addressInfo: {
    flex: 1,
    marginLeft: Math.round(12 * scale),
  },
  addressLabel: {
    fontSize: Math.round(14 * scale),
    fontWeight: '600',
    color: colors.accent,
    marginBottom: Math.round(4 * scale),
  },
  addressText: {
    fontSize: Math.round(16 * scale),
    color: colors.textPrimary,
    marginBottom: Math.round(4 * scale),
  },
  addressDetails: {
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Math.round(12 * scale),
  },
  billLabel: {
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
  },
  billValue: {
    fontSize: Math.round(14 * scale),
    fontWeight: '600',
    color: colors.textPrimary,
  },
  dividerLine: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: Math.round(12 * scale),
  },
  billTotal: {
    fontSize: Math.round(18 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  billTotalValue: {
    fontSize: Math.round(18 * scale),
    fontWeight: 'bold',
    color: colors.accent,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Math.round(8 * scale),
  },
  paymentMethodText: {
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
    marginLeft: Math.round(6 * scale),
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Math.round(14 * scale),
    borderRadius: Math.round(12 * scale),
    borderWidth: 2,
    borderColor: colors.accent,
    marginBottom: Math.round(12 * scale),
  },
  helpButtonText: {
    fontSize: Math.round(16 * scale),
    fontWeight: '600',
    color: colors.accent,
    marginLeft: Math.round(8 * scale),
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Math.round(14 * scale),
    borderRadius: Math.round(12 * scale),
    borderWidth: 2,
    borderColor: colors.error,
  },
  cancelButtonText: {
    fontSize: Math.round(16 * scale),
    fontWeight: '600',
    color: colors.error,
    marginLeft: Math.round(8 * scale),
  },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    paddingVertical: Math.round(16 * scale),
    borderRadius: Math.round(12 * scale),
  },
  rateButtonText: {
    fontSize: Math.round(16 * scale),
    fontWeight: '600',
    color: colors.textInverse,
    marginLeft: Math.round(8 * scale),
  },
});

export default OrderTrackingScreen;
