import { GOOGLE_MAPS_API_KEY } from '@/config';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import MapView, { AnimatedRegion, Marker } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { socket } from '../sockets/socket';

const GOOGLE_MAPS_APIKEY = GOOGLE_MAPS_API_KEY;

export default function RiderScreen() {
  const { pickupLat, pickupLng, dropLat, dropLng, rideId } = useLocalSearchParams();
  const pickup = { latitude: +pickupLat, longitude: +pickupLng };
  const drop = { latitude: +dropLat, longitude: +dropLng };
  const router = useRouter();

  const [status, setStatus] = useState('waiting');
  const [eta, setEta] = useState<number | null>(null);

  // 🚗 animated driver marker
  const [driverCoord] = useState(
    new AnimatedRegion({
      latitude: pickup.latitude,
      longitude: pickup.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    })
  );

  // 📍 plain state for MapViewDirections
  const [driverPathOrigin, setDriverPathOrigin] = useState(pickup);

  const rotationAnim = useRef(new Animated.Value(0)).current;
  const prevDriverLoc = useRef<{ latitude: number; longitude: number } | null>(null);

  const mapRef = useRef<MapView | null>(null);
  const locationWatcherRef = useRef<any>(null);

  // Rider’s own location (optional)
  useEffect(() => {
    const startTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      locationWatcherRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 10 },
        () => {}
      );
    };

    startTracking();

    return () => {
      if (locationWatcherRef.current) {
        locationWatcherRef.current.remove();
        locationWatcherRef.current = null;
      }
    };
  }, []);

  // Driver updates
  useEffect(() => {
const onDriverLocation = ({ rideId: incomingRideId, coords }) => {
  if (incomingRideId === rideId && coords?.latitude && coords?.longitude) {
    const newLoc = { latitude: coords.latitude, longitude: coords.longitude };

    // 🛑 Ignore jitter smaller than 3m
    if (prevDriverLoc.current) {
      const moved = getDistance(prevDriverLoc.current, newLoc);
      if (moved < 3) return;
    }

    // 🚗 animate marker smoothly
    driverCoord.timing({
      latitude: newLoc.latitude,
      longitude: newLoc.longitude,
      duration: 2500,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start();

    // 🔄 animate rotation
    if (prevDriverLoc.current) {
      const newBearing = getBearing(
        prevDriverLoc.current.latitude,
        prevDriverLoc.current.longitude,
        newLoc.latitude,
        newLoc.longitude
      );

      Animated.timing(rotationAnim, {
        toValue: newBearing,
        duration: 2500,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }).start();
    }

    prevDriverLoc.current = newLoc;

    // 👉 Only update MapViewDirections if moved > 15m
    if (getDistance(driverPathOrigin, newLoc) > 15) {
      setDriverPathOrigin(newLoc);
    }

    // ETA (rough)
    const distanceMeters = getDistance(newLoc, pickup);
    const speedKmph = 30;
    const etaMinutes = Math.max(
      Math.round((distanceMeters / 1000 / speedKmph) * 60),
      1
    );
    setEta(etaMinutes);
  }
};
    const onRiderPresent = ({ rideId: presentRideId }) => {
      if (presentRideId === rideId) {
        setStatus('in_progress');
        mapRef.current?.fitToCoordinates([pickup, drop], {
          edgePadding: { top: 80, bottom: 80, left: 80, right: 80 },
          animated: true,
        });
      }
    };

    socket.on('driverLocation', onDriverLocation);
    socket.on('riderPresent', onRiderPresent);

    return () => {
      socket.off('driverLocation', onDriverLocation);
      socket.off('riderPresent', onRiderPresent);
    };
  }, [rideId]);

  // Ride end
  useEffect(() => {
    socket.emit('joinRide', { rideId });

    const onRideEnded = ({ rideId: endedRideId }) => {
      if (endedRideId === rideId) {
        router.push('/rideend');
      }
    };

    socket.on('rideEnded', onRideEnded);
    return () => socket.off('rideEnded', onRideEnded);
  }, [rideId]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        showsUserLocation
        initialRegion={{
          latitude: pickup.latitude,
          longitude: pickup.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
      >
        <Marker coordinate={pickup} title="Pickup" />
        <Marker coordinate={drop} title="Drop" />

        {/* 🚗 animated car marker */}
        <Marker.Animated coordinate={driverCoord} anchor={{ x: 0.5, y: 0.5 }} flat>
          <Animated.Image
            source={require('.././assets/car_top.png')}
            style={{
              width: 40,
              height: 40,
              resizeMode: 'contain',
              transform: [
                {
                  rotate: rotationAnim.interpolate({
                    inputRange: [0, 360],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
            }}
          />
        </Marker.Animated>

        {/* driver → pickup path */}
        {status === 'waiting' && (
          <MapViewDirections
            origin={driverPathOrigin}
            destination={pickup}
            apikey={GOOGLE_MAPS_APIKEY}
            strokeWidth={4}
            strokeColor="yellow"
          />
        )}

        {/* pickup → drop path */}
        {status === 'in_progress' && (
          <MapViewDirections
            origin={driverPathOrigin}
            destination={drop}
            apikey={GOOGLE_MAPS_APIKEY}
            strokeWidth={4}
            strokeColor="#00FF00"
          />
        )}
      </MapView>

      {status === 'waiting' && eta && (
        <View style={styles.arrivedBanner}>
          <Text style={styles.arrivedText}>Driver arriving in {eta} min</Text>
        </View>
      )}
    </View>
  );
}

// Distance calc
function getDistance(coord1, coord2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(coord2.latitude - coord1.latitude);
  const dLon = toRad(coord2.longitude - coord1.longitude);
  const lat1 = toRad(coord1.latitude);
  const lat2 = toRad(coord2.latitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// Bearing calc
function getBearing(startLat, startLng, endLat, endLng) {
  const toRad = (d) => (d * Math.PI) / 180.0;
  const toDeg = (r) => (r * 180.0) / Math.PI;
  const dLon = toRad(endLng - startLng);
  const lat1 = toRad(startLat);
  const lat2 = toRad(endLat);
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  map: { flex: 1 },
  arrivedBanner: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    backgroundColor: '#FFD700',
    padding: 12,
    borderRadius: 8,
  },
  arrivedText: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
