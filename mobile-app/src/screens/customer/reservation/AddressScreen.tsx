import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, FlatList, Keyboard } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Check, LocateFixed, Search } from 'lucide-react-native';
import MapView, { Marker, UrlTile } from 'react-native-maps';
import * as Location from 'expo-location';
import ScreenWrapper from '../../../components/common/ScreenWrapper';
import MapAttribution from '../../../components/common/MapAttribution';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { setAddress } from '../../../store/slices/customer/reservation.slice';
import { COLORS } from '../../../theme/colors';
import { commonStyles } from './styles/common.styles';
import styles from './styles/Address.styles';
import { useDebounce } from '../../../hooks/useDebounce';
import { osmService, OSMPlace } from '../../../services/maps/osmService';
import { MAP_TILE_MAX_ZOOM, MAP_TILE_URL } from '../../../constants/maps';

const DEFAULT_REGION = {
  latitude: 6.9271, // Colombo
  longitude: 79.8612,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

type AddressTarget = 'pickup' | 'delivery';

const AddressScreen = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { type } = useLocalSearchParams<{ type?: string }>();
  const initialTarget: AddressTarget = type === 'delivery' ? 'delivery' : 'pickup';

  const {
    pickupAddress,
    deliveryAddress,
    pickupLat,
    pickupLng,
    deliveryLat,
    deliveryLng,
  } = useAppSelector((state) => state.reservation);
  const userAddress = useAppSelector((state) => state.auth.user?.address);

  const addressesSame =
    !!pickupAddress && !!deliveryAddress
      ? pickupAddress === deliveryAddress && pickupLat === deliveryLat && pickupLng === deliveryLng
      : !deliveryAddress && !!pickupAddress;

  const [activeTarget, setActiveTarget] = useState<AddressTarget>(initialTarget);
  const [sameAsPickup, setSameAsPickup] = useState(
    initialTarget === 'delivery' ? false : addressesSame
  );

  const [pickup, setPickup] = useState(pickupAddress || userAddress || '');
  const [delivery, setDelivery] = useState(deliveryAddress || pickupAddress || userAddress || '');
  const [pickupCoords, setPickupCoords] = useState<{ latitude: number; longitude: number } | null>(
    pickupLat != null && pickupLng != null ? { latitude: pickupLat, longitude: pickupLng } : null
  );
  const [deliveryCoords, setDeliveryCoords] = useState<{ latitude: number; longitude: number } | null>(
    deliveryLat != null && deliveryLng != null ? { latitude: deliveryLat, longitude: deliveryLng } : null
  );

  const [locationLoading, setLocationLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef<MapView>(null);

  // Search logic
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<OSMPlace[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedSearchQuery = useDebounce(searchQuery, 800);

  const getActiveAddress = () => (activeTarget === 'pickup' ? pickup : delivery);
  const getActiveCoords = () => (activeTarget === 'pickup' ? pickupCoords : deliveryCoords);

  const setActiveAddress = (value: string) => {
    if (activeTarget === 'pickup') {
      setPickup(value);
      if (sameAsPickup) setDelivery(value);
    } else {
      setDelivery(value);
      if (sameAsPickup) setSameAsPickup(false);
    }
  };

  const setActiveCoords = (coords: { latitude: number; longitude: number }) => {
    if (activeTarget === 'pickup') {
      setPickupCoords(coords);
      if (sameAsPickup) setDeliveryCoords(coords);
    } else {
      setDeliveryCoords(coords);
      if (sameAsPickup) setSameAsPickup(false);
    }
  };

  const focusRegion = (coords: { latitude: number; longitude: number } | null) => {
    const target = coords || DEFAULT_REGION;
    mapRef.current?.animateToRegion({
      latitude: target.latitude,
      longitude: target.longitude,
      latitudeDelta: DEFAULT_REGION.latitudeDelta,
      longitudeDelta: DEFAULT_REGION.longitudeDelta,
    });
  };

  useEffect(() => {
    if (!pickup && userAddress) {
      setPickup(userAddress);
      if (!delivery) setDelivery(userAddress);
    }
  }, [userAddress]);

  useEffect(() => {
    const fetchPlaces = async () => {
      if (debouncedSearchQuery.trim().length >= 3) {
        setIsSearching(true);
        const results = await osmService.searchPlaces(debouncedSearchQuery);
        setSearchResults(results);
        setIsSearching(false);
      } else {
        setSearchResults([]);
      }
    };
    fetchPlaces();
  }, [debouncedSearchQuery]);

  const reverseGeocode = async (lat: number, lng: number, target: AddressTarget) => {
    setLocationLoading(true);
    const address = await osmService.reverseGeocode(lat, lng);
    if (target === 'pickup') {
      setPickup(address);
      if (sameAsPickup) setDelivery(address);
    } else {
      setDelivery(address);
    }
    setLocationLoading(false);
  };

  const applyCurrentLocation = async (target: AddressTarget) => {
    try {
      setLocationLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const location = await Location.getCurrentPositionAsync({});
      const coords = { latitude: location.coords.latitude, longitude: location.coords.longitude };
      if (target === 'pickup') {
        setPickupCoords(coords);
        if (sameAsPickup) setDeliveryCoords(coords);
      } else {
        setDeliveryCoords(coords);
        setSameAsPickup(false);
      }
      focusRegion(coords);
      await reverseGeocode(coords.latitude, coords.longitude, target);
    } catch (error) {
      console.error('Get Current Location failed', error);
    } finally {
      setLocationLoading(false);
    }
  };

  useEffect(() => {
    const activeCoords = initialTarget === 'pickup' ? pickupCoords : deliveryCoords;
    if (activeCoords) {
      setMapReady(true);
      setTimeout(() => focusRegion(activeCoords), 0);
      return;
    }
    applyCurrentLocation(initialTarget).finally(() => setMapReady(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    focusRegion(getActiveCoords());
    setSearchQuery('');
    setSearchResults([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTarget]);

  useEffect(() => {
    if (sameAsPickup) {
      setDelivery(pickup);
      setDeliveryCoords(pickupCoords);
    }
  }, [sameAsPickup, pickup, pickupCoords]);

  const handleMapPress = (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    const coords = { latitude, longitude };
    setActiveCoords(coords);
    focusRegion(coords);
    reverseGeocode(latitude, longitude, activeTarget);
  };

  const handleSelectPlace = (place: OSMPlace) => {
    Keyboard.dismiss();
    const coords = { latitude: parseFloat(place.lat), longitude: parseFloat(place.lon) };
    setActiveAddress(place.display_name);
    setActiveCoords(coords);
    setSearchQuery('');
    setSearchResults([]);
    focusRegion(coords);
  };

  const handleConfirm = () => {
    const finalPickup = pickup.trim();
    const finalDelivery = (sameAsPickup ? pickup : delivery).trim();
    const finalPickupCoords = pickupCoords;
    const finalDeliveryCoords = sameAsPickup ? pickupCoords : deliveryCoords;

    if (!finalPickup || !finalDelivery) return;

    dispatch(setAddress({
      pickup: finalPickup,
      delivery: finalDelivery,
      pickupLat: finalPickupCoords?.latitude ?? null,
      pickupLng: finalPickupCoords?.longitude ?? null,
      deliveryLat: finalDeliveryCoords?.latitude ?? null,
      deliveryLng: finalDeliveryCoords?.longitude ?? null,
    }));
    router.back();
  };

  const activeCoords = getActiveCoords() || pickupCoords || deliveryCoords || DEFAULT_REGION;
  const canConfirm = !!pickup.trim() && !!(sameAsPickup ? pickup.trim() : delivery.trim()) && !locationLoading;

  const header = (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <ChevronLeft size={24} color={COLORS.TEXT_PRIMARY} />
      </TouchableOpacity>
    </View>
  );

  const footer = (
    <View style={commonStyles.footer}>
      <TouchableOpacity
        style={[commonStyles.primaryButton, !canConfirm && { opacity: 0.5 }]}
        onPress={handleConfirm}
        disabled={!canConfirm}
      >
        <Text style={commonStyles.primaryButtonText}>Confirm Locations</Text>
      </TouchableOpacity>
    </View>
  );

  const TargetTab = ({ target, label }: { target: AddressTarget; label: string }) => {
    const active = activeTarget === target;
    return (
      <TouchableOpacity
        onPress={() => {
          if (target === 'delivery' && sameAsPickup) setSameAsPickup(false);
          setActiveTarget(target);
        }}
        style={{
          flex: 1,
          paddingVertical: 10,
          borderRadius: 14,
          alignItems: 'center',
          backgroundColor: active ? COLORS.PRIMARY : 'transparent',
        }}
      >
        <Text style={{ fontWeight: '700', color: active ? COLORS.WHITE : COLORS.TEXT_SECONDARY }}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenWrapper
      header={header}
      footer={footer}
      scroll
      withKeyboardAvoidingView
    >
      <View style={commonStyles.container}>
        <Text style={commonStyles.title}>Pickup & Delivery Locations</Text>
        <Text style={commonStyles.subtitle}>
          Choose separate locations for pickup and delivery, or use the same address for both.
        </Text>

        <View style={{ flexDirection: 'row', backgroundColor: COLORS.BORDER_LIGHT, borderRadius: 16, padding: 4, marginTop: 20, gap: 4 }}>
          <TargetTab target="pickup" label="Pickup" />
          <TargetTab target="delivery" label="Delivery" />
        </View>

        <View style={{ zIndex: 10, marginTop: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.WHITE, borderRadius: 20, paddingHorizontal: 16, borderWidth: 1.5, borderColor: COLORS.BORDER_LIGHT, height: 50 }}>
            <Search size={20} color={COLORS.TEXT_MUTED} />
            <TextInput
              style={{ flex: 1, marginLeft: 10, fontSize: 15, color: COLORS.TEXT_PRIMARY }}
              placeholder={`Search for ${activeTarget} area or building...`}
              placeholderTextColor={COLORS.TEXT_MUTED}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {isSearching && <ActivityIndicator size="small" color={COLORS.PRIMARY} />}
          </View>

          {searchResults.length > 0 && (
            <View style={{ backgroundColor: COLORS.WHITE, borderRadius: 16, marginTop: 8, borderWidth: 1, borderColor: COLORS.BORDER_LIGHT, maxHeight: 200, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 }}>
              <FlatList
                data={searchResults}
                keyExtractor={(item) => item.place_id.toString()}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}
                    onPress={() => handleSelectPlace(item)}
                  >
                    <Text style={{ fontSize: 14, color: COLORS.TEXT_PRIMARY, fontWeight: '600' }} numberOfLines={2}>
                      {item.display_name}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}
        </View>

        <View style={[styles.mapCard, { marginTop: 16, zIndex: -1 }]}>
          <View style={styles.mapWrapper}>
            {!mapReady ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={COLORS.PRIMARY} />
                <Text style={{ marginTop: 12, color: COLORS.TEXT_SECONDARY }}>Initializing Map...</Text>
              </View>
            ) : (
              <>
                <MapView
                  ref={mapRef}
                  style={styles.map}
                  initialRegion={{
                    latitude: activeCoords.latitude,
                    longitude: activeCoords.longitude,
                    latitudeDelta: DEFAULT_REGION.latitudeDelta,
                    longitudeDelta: DEFAULT_REGION.longitudeDelta,
                  }}
                  onPress={handleMapPress}
                  mapType="none"
                >
                  <UrlTile
                    urlTemplate={MAP_TILE_URL}
                    maximumZ={MAP_TILE_MAX_ZOOM}
                    flipY={false}
                  />
                  <Marker
                    coordinate={{ latitude: activeCoords.latitude, longitude: activeCoords.longitude }}
                    draggable
                    onDragEnd={handleMapPress}
                    title={activeTarget === 'pickup' ? 'Pickup Location' : 'Delivery Location'}
                  />
                </MapView>
                <MapAttribution />
                <TouchableOpacity style={styles.locateBtn} onPress={() => applyCurrentLocation(activeTarget)}>
                  <LocateFixed size={20} color={COLORS.PRIMARY} />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        <View style={[styles.scrollContent, { zIndex: -1 }]}>
          <View style={styles.section}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={styles.sectionTitle}>Pickup Address</Text>
              {locationLoading && activeTarget === 'pickup' && <ActivityIndicator size="small" color={COLORS.PRIMARY} />}
            </View>
            <TextInput
              style={styles.input}
              placeholder="House no, Street name, City..."
              placeholderTextColor={COLORS.TEXT_MUTED}
              multiline
              value={pickup}
              editable={activeTarget === 'pickup'}
              onFocus={() => setActiveTarget('pickup')}
              onChangeText={(val) => {
                setPickup(val);
                if (sameAsPickup) setDelivery(val);
              }}
            />
          </View>

          <View style={styles.section}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={styles.sectionTitle}>Delivery Address</Text>
              {locationLoading && activeTarget === 'delivery' && <ActivityIndicator size="small" color={COLORS.PRIMARY} />}
            </View>

            <TextInput
              style={styles.input}
              placeholder="House no, Street name, City..."
              placeholderTextColor={COLORS.TEXT_MUTED}
              multiline
              value={sameAsPickup ? pickup : delivery}
              editable={!sameAsPickup && activeTarget === 'delivery'}
              onFocus={() => {
                if (sameAsPickup) setSameAsPickup(false);
                setActiveTarget('delivery');
              }}
              onChangeText={(val) => {
                setDelivery(val);
                if (sameAsPickup) setSameAsPickup(false);
              }}
            />

            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => {
                const next = !sameAsPickup;
                setSameAsPickup(next);
                if (next) {
                  setDelivery(pickup);
                  setDeliveryCoords(pickupCoords);
                  setActiveTarget('pickup');
                } else if (!delivery) {
                  setDelivery(pickup);
                  setDeliveryCoords(pickupCoords);
                  setActiveTarget('delivery');
                } else {
                  setActiveTarget('delivery');
                }
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, sameAsPickup && styles.checkboxActive]}>
                {sameAsPickup && <Check size={14} color={COLORS.WHITE} />}
              </View>
              <Text style={styles.checkboxLabel}>Same as pickup address</Text>
            </TouchableOpacity>

            <Text style={{ marginTop: 8, color: COLORS.TEXT_MUTED, fontSize: 13 }}>
              {sameAsPickup
                ? 'Delivery will use the same location as pickup.'
                : `Selecting ${activeTarget === 'delivery' ? 'delivery' : 'pickup'} on the map/search will update that location.`}
            </Text>
          </View>
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default AddressScreen;
