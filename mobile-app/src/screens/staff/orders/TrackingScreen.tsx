import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator, Linking } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Navigation, MapPin, Phone, CheckCircle } from 'lucide-react-native';
import MapView, { Marker, UrlTile, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import polyline from '@mapbox/polyline';
import ScreenWrapper from '../../../components/common/ScreenWrapper';
import MapAttribution from '../../../components/common/MapAttribution';
import { COLORS } from '../../../theme/colors';
import { staffOrderService } from '../../../services/staff/staffOrderService';
import { notify } from '../../../utils/notify';
import { emitStaffLocation } from '../../../services/socketService';
import { osmService } from '../../../services/maps/osmService';
import { MAP_TILE_MAX_ZOOM, MAP_TILE_URL } from '../../../constants/maps';

const { width, height } = Dimensions.get('window');

const StaffTrackingScreen = () => {
  const router = useRouter();
  const { orderId } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [arrivalLoading, setArrivalLoading] = useState(false);
  const [staffLocation, setStaffLocation] = useState<any>(null);
  const [routeCoords, setRouteCoords] = useState<{ latitude: number, longitude: number }[]>([]);

  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    let subscription: Location.LocationSubscription;

    const initTracking = async () => {
      try {
        setLoading(true);

        const orderData = await staffOrderService.getOrderById(orderId as string);
        setOrder(orderData);
        if (orderData.status === 'PICKUP_ARRIVED' || orderData.status === 'DELIVERY_ARRIVED') {
          setIsArrived(true);
        }

        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          notify.error('Permission Denied', 'Location access is required for tracking');
          return;
        }

        let location = await Location.getCurrentPositionAsync({});
        setStaffLocation(location.coords);

        let currentOrderData = orderData;
        const onTheWayStatus = orderData.status === 'PICKUP_ASSIGNED'
          ? 'PICKUP_ON_THE_WAY'
          : orderData.status === 'DELIVERY_ASSIGNED'
            ? 'DELIVERY_ON_THE_WAY'
            : null;
        if (onTheWayStatus) {
          await staffOrderService.updateOrderStatus(orderId as string, onTheWayStatus);
          currentOrderData = { ...orderData, status: onTheWayStatus };
          setOrder(currentOrderData);
        }

        const isPickup = currentOrderData?.status?.includes('PICKUP') || currentOrderData?.status === 'PENDING';
        const destLat = isPickup ? currentOrderData?.pickupLat : currentOrderData?.deliveryLat;
        const destLng = isPickup ? currentOrderData?.pickupLng : currentOrderData?.deliveryLng;

        if (destLat && destLng) {
          const encodedPolyline = await osmService.getDirections(
            location.coords.latitude, location.coords.longitude,
            destLat, destLng
          );

          if (encodedPolyline) {
            const decoded = polyline.decode(encodedPolyline);
            const coords = decoded.map((point: any) => ({
              latitude: point[0],
              longitude: point[1]
            }));
            setRouteCoords(coords);
          }
        }

        subscription = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, distanceInterval: 10 },
          (newLoc) => {
            const coords = newLoc.coords;
            setStaffLocation(coords);
            emitStaffLocation(orderId as string, { lat: coords.latitude, lng: coords.longitude });
          }
        );

      } catch (error) {
        notify.error('Tracking Error', 'Could not initialize map tracking');
      } finally {
        setLoading(false);
      }
    };

    initTracking();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [orderId]);

  useEffect(() => {
    if (!mapRef.current) return;

    const validDest =
      destCoords && typeof destCoords.latitude === 'number' && typeof destCoords.longitude === 'number'
        ? destCoords
        : null;

    const points = routeCoords.length > 0
      ? routeCoords
      : staffLocation && validDest
        ? [{ latitude: staffLocation.latitude, longitude: staffLocation.longitude }, validDest]
        : staffLocation
          ? [{ latitude: staffLocation.latitude, longitude: staffLocation.longitude }]
          : validDest
            ? [validDest]
            : [];

    if (points.length > 0) {
      mapRef.current.fitToCoordinates(points, {
        edgePadding: { top: 80, right: 60, bottom: 320, left: 60 },
        animated: true,
      });
    }
  }, [routeCoords, staffLocation?.latitude, staffLocation?.longitude, destCoords?.latitude, destCoords?.longitude]);

  const handleCall = () => {
    if (order?.userId?.telephone) {
      Linking.openURL(`tel:${order.userId.telephone}`);
    }
  };

  const handleDirections = () => {
    if (!destCoords?.latitude || !destCoords?.longitude) {
      notify.error('Directions unavailable', 'Destination location is not available for this order.');
      return;
    }
    const { latitude, longitude } = destCoords;
    const label = encodeURIComponent(isPickup ? 'Pickup location' : 'Delivery location');
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&destination_place_id=&travelmode=driving`;
    const appleUrl = `http://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=d&q=${label}`;
    Linking.openURL(appleUrl).catch(() => Linking.openURL(url));
  };

  const [isArrived, setIsArrived] = useState(false);

  const handleArrival = async () => {
    try {
      setArrivalLoading(true);
      await staffOrderService.notifyArrival(orderId as string);
      notify.success('Notification Sent', 'Customer has been notified of your arrival');
      setIsArrived(true);
      setOrder((currentOrder: any) => currentOrder ? {
        ...currentOrder,
        status: currentOrder.status.includes('DELIVERY') ? 'DELIVERY_ARRIVED' : 'PICKUP_ARRIVED'
      } : currentOrder);
    } catch (error: any) {
      notify.error('Error', error.message || 'Failed to notify arrival');
    } finally {
      setArrivalLoading(false);
    }
  };

  const isPickup = order?.status?.includes('PICKUP') || order?.status === 'PENDING';
  const destCoords = isPickup
    ? { latitude: order?.pickupLat || 6.9271, longitude: order?.pickupLng || 79.8612 }
    : { latitude: order?.deliveryLat || 6.9271, longitude: order?.deliveryLng || 79.8612 };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: COLORS.WHITE }}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        <Text style={{ textAlign: 'center', marginTop: 12, color: COLORS.TEXT_SECONDARY }}>Initializing Map...</Text>
      </View>
    );
  }

  return (
    <ScreenWrapper style={{ backgroundColor: '#E2E8F0' }} scroll={false}>
      {/* Real Map View */}
      <View style={trackStyles.mapContainer}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          mapType="none"
          initialRegion={{
            latitude: staffLocation?.latitude || destCoords.latitude,
            longitude: staffLocation?.longitude || destCoords.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          <UrlTile
            urlTemplate={MAP_TILE_URL}
            maximumZ={MAP_TILE_MAX_ZOOM}
            flipY={false}
          />

          {routeCoords.length > 0 && (
            <Polyline
              coordinates={routeCoords}
              strokeColor={COLORS.PRIMARY}
              strokeWidth={4}
            />
          )}

          {/* Rider Marker */}
          {staffLocation && (
            <Marker coordinate={staffLocation} title="Your Location">
              <View style={trackStyles.userPin}>
                <View style={trackStyles.pinOuter}>
                  <View style={trackStyles.pinInner} />
                </View>
              </View>
            </Marker>
          )}

          {/* Destination Marker */}
          <Marker coordinate={destCoords} title="Customer Location">
            <View style={trackStyles.destPinMarker}>
              <MapPin size={34} color={COLORS.PRIMARY} fill={COLORS.PRIMARY_LIGHT} />
            </View>
          </Marker>
        </MapView>
        <MapAttribution style={{ left: undefined, right: 12, bottom: undefined, top: 56 }} />
      </View>

      <View style={trackStyles.headerOverlay}>
        <TouchableOpacity onPress={() => router.back()} style={trackStyles.backBtn}>
          <ArrowLeft size={24} color={COLORS.TEXT_PRIMARY} />
        </TouchableOpacity>
      </View>

      {/* Destination Card */}
      <View style={trackStyles.bottomSheet}>
        <View style={trackStyles.handle} />

        <View style={trackStyles.infoRow}>
          <View style={trackStyles.etaBox}>
            <Text style={trackStyles.etaValue}>~15</Text>
            <Text style={trackStyles.etaLabel}>Mins</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 20 }}>
            <Text style={trackStyles.destTitle}>
              {isPickup ? 'Pickup Items' : 'Deliver Order'}
            </Text>
            <Text style={trackStyles.addressText} numberOfLines={1}>
              {isPickup ? order?.pickupAddress : order?.deliveryAddress}
            </Text>
          </View>
        </View>

        <View style={trackStyles.divider} />

        <View style={trackStyles.customerRow}>
          <View style={trackStyles.avatar}>
            <Text style={trackStyles.avatarText}>{order?.userId?.name[0] || 'C'}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={trackStyles.customerName}>{order?.userId?.name || 'Customer'}</Text>
            <Text style={trackStyles.orderId}>#{order?.orderNo}</Text>
          </View>
          <TouchableOpacity style={trackStyles.actionBtn} onPress={handleCall}>
            <Phone size={20} color={COLORS.WHITE} fill={COLORS.WHITE} />
          </TouchableOpacity>
          <TouchableOpacity style={[trackStyles.actionBtn, { backgroundColor: COLORS.PRIMARY, marginLeft: 10 }]} onPress={handleDirections}>
            <Navigation size={20} color={COLORS.WHITE} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[trackStyles.arrivalBtn, isArrived && { backgroundColor: COLORS.SUCCESS }]}
          onPress={handleArrival}
          disabled={arrivalLoading || isArrived}
        >
          {arrivalLoading ? (
            <ActivityIndicator color={COLORS.WHITE} />
          ) : (
            <>
              <CheckCircle size={20} color={COLORS.WHITE} />
              <Text style={trackStyles.arrivalBtnText}>
                {isArrived ? 'Arrived' : 'I have Arrived'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScreenWrapper>
  );
};

const trackStyles = StyleSheet.create({
  mapContainer: {
    flex: 1,
    backgroundColor: '#E2E8F0',
  },
  userPin: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinOuter: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.PRIMARY,
    borderWidth: 2,
    borderColor: COLORS.WHITE,
  },
  destPinMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 20,
    shadowColor: COLORS.BLACK,
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  bottomSheet: {
    backgroundColor: COLORS.WHITE,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingTop: 12,
    shadowColor: COLORS.BLACK,
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  etaBox: {
    backgroundColor: COLORS.PRIMARY,
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 70,
  },
  etaValue: {
    color: COLORS.WHITE,
    fontSize: 18,
    fontWeight: '800',
  },
  etaLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    fontWeight: '700',
  },
  destTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.TEXT_PRIMARY,
  },
  addressText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 20,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.PRIMARY_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.PRIMARY,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
  },
  orderId: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
  },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.SUCCESS,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrivalBtn: {
    backgroundColor: COLORS.PRIMARY,
    padding: 18,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  arrivalBtnText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: '800',
  }
});

export default StaffTrackingScreen;
