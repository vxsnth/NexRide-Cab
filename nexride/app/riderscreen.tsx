import { GOOGLE_MAPS_API_KEY } from '@/config';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { socket } from '../sockets/socket';
const GOOGLE_MAPS_APIKEY = GOOGLE_MAPS_API_KEY;

export default function RiderScreen() {
  const { pickupLat, pickupLng, dropLat, dropLng, rideId } = useLocalSearchParams();
  const pickup = { latitude: +pickupLat, longitude: +pickupLng };
  const drop = { latitude: +dropLat, longitude: +dropLng };
  const router = useRouter();

  const [driverCoords, setDriverCoords] = useState(null);
  const [status, setStatus] = useState('waiting');
  const [eta, setEta] = useState(null);

  const mapRef = useRef(null);
  const locationWatcherRef = useRef(null); // optional if you want to track rider location

  // Optional: track rider location for live updates (if needed)
  useEffect(() => {
    const startTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      locationWatcherRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 10 },
        (loc) => {
          // Currently we don't use rider coords, but you can forward to server if needed
        }
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

  // Listen to driver location and rider status
  useEffect(() => {
    const onDriverLocation = ({ rideId: incomingRideId, coords }) => {
      if (incomingRideId === rideId && coords?.latitude && coords?.longitude) {
        setDriverCoords(coords);
        const distanceMeters = getDistance(coords, pickup);
        const speedKmph = 30; // assumed average speed
        const etaMinutes = Math.max(Math.round((distanceMeters / 1000) / speedKmph * 60), 1);
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

  // Listen to ride end event
  useEffect(() => {
    socket.emit('joinRide', { rideId });

    const onRideEnded = ({ rideId: endedRideId }) => {
      if (endedRideId === rideId) {
        console.log('Ride ended, navigating to RideEnd screen');
        router.push('/rideend');
      }
    };

    socket.on('rideEnded', onRideEnded);

    return () => {
      socket.off('rideEnded', onRideEnded);
    };
  }, [rideId]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        showsUserLocation={true}
        initialRegion={{
          latitude: pickup.latitude,
          longitude: pickup.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
      >
        <Marker coordinate={pickup} title="Pickup" />
        <Marker coordinate={drop} title="Drop" />
        {driverCoords && <Marker coordinate={driverCoords} title="Driver" pinColor="blue" />}

        {status === 'in_progress' && (
          <MapViewDirections
            origin={pickup}
            destination={drop}
            apikey={GOOGLE_MAPS_APIKEY}
            strokeWidth={4}
            strokeColor="#00FF00"
            onError={(e) => console.log('MapViewDirections error:', e)}
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

function getDistance(coord1, coord2) {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(coord2.latitude - coord1.latitude);
  const dLon = toRad(coord2.longitude - coord1.longitude);
  const lat1 = toRad(coord1.latitude);
  const lat2 = toRad(coord2.latitude);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
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
