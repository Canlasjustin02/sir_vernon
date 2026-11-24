import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Bell,
  Info,
  WashingMachine,
  Shirt,
  Pocket,
  Diamond,
  MapPin,
  Store,
} from 'lucide-react-native';
import ScreenWrapper from '../../../components/common/ScreenWrapper';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import Loading from '../../../components/common/Loading';
import { COLORS } from '../../../theme/colors';
import styles from './styles/HomeScreen.styles';
import { orderService } from '../../../services/customer/orderService';
import { Order } from '../../../types/order.types';
import { useAppSelector } from '../../../store/hooks';
import FeedbackModal from '../../../components/customer/FeedbackModal';
import Avatar from '../../../components/common/Avatar';
import { shopService, LaundryShop } from '../../../services/customer/shopService';

const SERVICES = [
  { id: '1', name: 'Wash & Fold', desc: 'Everyday Items', icon: WashingMachine },
  { id: '2', name: 'Dry Clean', desc: 'Delicate Care', icon: Shirt },
  { id: '3', name: 'Ironing', desc: 'Professional Press', icon: Pocket },
  { id: '4', name: 'Premium', desc: 'Luxury Fabrics', icon: Diamond },
];

const CustomerHomeScreen = () => {
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [feedbackOrder, setFeedbackOrder] = useState<Order | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [shops, setShops] = useState<LaundryShop[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [loadingShops, setLoadingShops] = useState(true);

  const fetchActiveOrder = async () => {
    try {
      const order = await orderService.getActiveOrder();
      setActiveOrder(order);

      const allOrders = await orderService.getMyOrders();
      const unreviewedDeliveredOrder = allOrders.find(
        o => o.status === 'DELIVERED' && !o.isReviewed
      );

      if (unreviewedDeliveredOrder) {
        setFeedbackOrder(unreviewedDeliveredOrder);
        setModalVisible(true);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchActiveOrder();
    shopService.getAvailableShops()
      .then((availableShops) => {
        setShops(availableShops);
        setSelectedShopId(availableShops[0]?._id ?? null);
      })
      .catch((error) => console.error('Failed to fetch laundry shops:', error))
      .finally(() => setLoadingShops(false));
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchActiveOrder();
    shopService.getAvailableShops()
      .then(setShops)
      .catch((error) => console.error('Failed to refresh laundry shops:', error));
  };

  const startReservation = (shopOwnerId: string) => {
    router.push({
      pathname: '/(protected)/(customer)/reservation/service-mode',
      params: { shopOwnerId },
    });
  };

  const selectedShop = shops.find((shop) => shop._id === selectedShopId) ?? shops[0];

  if (loading) return <Loading fullScreen />;

  const header = (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.userInfo}
        onPress={() => router.push('/(protected)/(customer)/profile')}
      >
        <Avatar
          name={user?.name || 'Customer'}
          source={user?.avatar}
          size={45}
        />
        <View style={{ marginLeft: 12 }}>
          <Text style={styles.welcomeText}>Welcome Back</Text>
          <Text style={styles.userName}>Hello, {user?.name?.split(' ')[0] || 'Customer'}!</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/(protected)/(customer)/notifications')}>
        <Bell color={COLORS.TEXT_PRIMARY} size={22} />
      </TouchableOpacity>
    </View>
  );

  const footer = (
    <View style={styles.footer}>
      <Button
        title={selectedShop ? `Book at ${selectedShop.name}` : 'No shops available'}
        onPress={() => selectedShop && startReservation(selectedShop._id)}
        disabled={!selectedShop}
        size="xl"
        style={styles.reservationButton}
      />
    </View>
  );

  return (
    <ScreenWrapper
      statusBarColor={COLORS.WHITE}
      style={styles.container}
      scroll
      header={header}
      footer={footer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[COLORS.PRIMARY]}
          tintColor={COLORS.PRIMARY}
        />
      }
    >
      <View style={styles.content}>
        {/* Tracking Card */}
        {activeOrder && activeOrder.status !== 'CANCELLED' ? (
          <View style={styles.trackingCard}>
            <View style={styles.trackingHeader}>
              <View>
                <Badge
                  label={`In Progress - ${(activeOrder.status ?? 'UNKNOWN').replace(/_/g, ' ')}`}
                  variant="primary"
                />
                <Text style={[styles.trackingTitle, { marginTop: 12 }]}>
                  Order ID: #{activeOrder.orderNo}
                </Text>
                <Text style={styles.trackingSubtitle}>
                  Last Update: {activeOrder.updatedAt ? new Date(activeOrder.updatedAt).toLocaleString() : 'N/A'}
                </Text>
              </View>
              <View style={[styles.serviceIconContainer, { backgroundColor: COLORS.PRIMARY_SOFT, marginBottom: 0 }]}>
                <WashingMachine color={COLORS.PRIMARY} size={24} />
              </View>
            </View>

            <View style={styles.trackingActions}>
              <Button
                title="Track Order"
                onPress={() => router.push({
                  pathname: '/(protected)/(customer)/orders/tracking',
                  params: { orderId: activeOrder._id }
                })}
                style={styles.trackButton}
              />
              <TouchableOpacity
                style={styles.infoButton}
                onPress={() => router.push(`/(protected)/(customer)/orders/${activeOrder._id}`)}
              >
                <Info
                  color={COLORS.TEXT_SECONDARY}
                  size={20}
                />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={[styles.trackingCard, { alignItems: 'center', paddingVertical: 40 }]}>
            <WashingMachine color={COLORS.PRIMARY_OUTLINE} size={48} />
            <Text style={[styles.trackingSubtitle, { marginTop: 16, textAlign: 'center' }]}>
              No active orders at the moment.
            </Text>
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Available laundry shops</Text>
        </View>
        {loadingShops ? (
          <Text style={{ color: COLORS.TEXT_SECONDARY, marginBottom: 20 }}>Loading nearby shops...</Text>
        ) : shops.length === 0 ? (
          <View style={[styles.trackingCard, { marginTop: 0 }]}>
            <Text style={styles.trackingSubtitle}>No laundry shops are available yet.</Text>
          </View>
        ) : (
          <View style={{ marginBottom: 12 }}>
            {shops.map((shop) => (
              <View
                key={shop._id}
                style={{
                  backgroundColor: selectedShopId === shop._id ? COLORS.PRIMARY_SOFT : COLORS.WHITE,
                  borderColor: selectedShopId === shop._id ? COLORS.PRIMARY : COLORS.BORDER_LIGHT,
                  borderWidth: 1,
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 12,
                }}
              >
                <TouchableOpacity
                  onPress={() => setSelectedShopId(shop._id)}
                  style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }}
                >
                  <Store color={COLORS.PRIMARY} size={20} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ color: COLORS.TEXT_PRIMARY, fontSize: 16, fontWeight: '700' }}>{shop.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 6 }}>
                      <MapPin color={COLORS.TEXT_MUTED} size={15} />
                      <Text style={{ flex: 1, marginLeft: 6, color: COLORS.TEXT_SECONDARY, fontSize: 12 }}>
                        {shop.address || 'Address not provided'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
                <Button
                  title="Book this shop"
                  onPress={() => startReservation(shop._id)}
                  size="md"
                />
              </View>
            ))}
          </View>
        )}

        {/* Services Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Our Services</Text>
        </View>

        <View style={styles.servicesGrid}>
          {SERVICES.map((service) => (
            <TouchableOpacity
              key={service.id}
              style={styles.serviceCard}
              activeOpacity={0.7}
              disabled={!selectedShop}
              onPress={() => selectedShop && startReservation(selectedShop._id)}
            >
              <View style={styles.serviceIconContainer}>
                <service.icon color={COLORS.PRIMARY} size={28} />
              </View>
              <Text style={styles.serviceName}>{service.name}</Text>
              <Text style={styles.serviceDesc}>{service.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FeedbackModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        order={feedbackOrder}
        onSubmitSuccess={fetchActiveOrder}
      />
    </ScreenWrapper>
  );
};

export default CustomerHomeScreen;
