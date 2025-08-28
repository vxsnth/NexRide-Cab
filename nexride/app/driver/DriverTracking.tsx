// DriverTracking.tsx (Crash-proof, clean, final)

import * as Location from 'expo-location';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { socket } from '../../sockets/socket';

const GOOGLE_MAPS_APIKEY = 'AIzaSyC0_i2q6-Zp5q6gJXIbvgzo5GL71A_bXX4';

function getDistanceMeters(coord1, coord2) {
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

export default function DriverTracking() {
  const { pickupLat, pickupLng, dropLat, dropLng, rideId } = useLocalSearchParams();

  const pickupCoords = { latitude: parseFloat(pickupLat), longitude: parseFloat(pickupLng) };
  const dropCoords = { latitude: parseFloat(dropLat), longitude: parseFloat(dropLng) };

  const [driverLocation, setDriverLocation] = useState(null);
  const [isNearPickup, setIsNearPickup] = useState(false);
  const [hasPickedUp, setHasPickedUp] = useState(false);
  const mapRef = useRef(null);

  useEffect(() => {
    let subscription = null;

    const startLocationTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Enable location to track your ride.');
        return;
      }

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 3000,
          distanceInterval: 3,
        },
        (location) => {
          if (!location?.coords) return;
          const coords = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          setDriverLocation(coords);
          socket.emit('driverLocation', { rideId, coords });

          const distance = getDistanceMeters(coords, pickupCoords);
          setIsNearPickup(distance <= 500000);
        }
      );
    };

    startLocationTracking();

    return () => {
      if (subscription) subscription.remove();
    };
  }, []);

  const confirmRiderPickup = () => {
    socket.emit('riderPresent', { rideId });
    setHasPickedUp(true);
  };

  if (!driverLocation) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: 'white' }}>Loading map...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        showsUserLocation={true}
        followsUserLocation={true}
        initialRegion={{
          latitude: driverLocation.latitude,
          longitude: driverLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        <Marker coordinate={driverLocation} title="Driver" pinColor="blue" />
        <Marker coordinate={pickupCoords} title="Pickup" />
        <Marker coordinate={dropCoords} title="Drop" />

        {hasPickedUp && (
          <MapViewDirections
            origin={pickupCoords}
            destination={dropCoords}
            apikey={GOOGLE_MAPS_APIKEY}
            strokeWidth={4}
            strokeColor="#00FF00"
            onError={(e) => console.log('MapViewDirections error:', e)}
          />
        )}
      </MapView>

      {!hasPickedUp && isNearPickup && (
        <View style={styles.confirmContainer}>
          <TouchableOpacity style={styles.confirmButton} onPress={confirmRiderPickup}>
            <Text style={styles.confirmText}>Rider Present - Start Ride 🎉</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'black' },
  confirmContainer: { position: 'absolute', bottom: 50, left: 0, right: 0, alignItems: 'center' },
  confirmButton: { backgroundColor: '#FFD700', padding: 14, borderRadius: 8 },
  confirmText: { color: 'black', fontWeight: 'bold' },
});