import { GOOGLE_MAPS_API_KEY } from '@/config';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { socket } from '../../sockets/socket';
const GOOGLE_MAPS_APIKEY = GOOGLE_MAPS_API_KEY;

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
  const { pickupLat, pickupLng, dropLat, dropLng, rideId,otp } = useLocalSearchParams();
  const pickupCoords = { latitude: parseFloat(pickupLat), longitude: parseFloat(pickupLng) };
  const dropCoords = { latitude: parseFloat(dropLat), longitude: parseFloat(dropLng) };
  const router = useRouter();
  const [driverLocation, setDriverLocation] = useState(null);
  const [isNearPickup, setIsNearPickup] = useState(false);
  const [isNearDrop, setIsNearDrop] = useState(false);
  const [hasPickedUp, setHasPickedUp] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState('');
  const mapRef = useRef(null);


  // ✅ Use a ref for subscription
  const locationSubscriptionRef = useRef(null);

  useEffect(() => {
    const startLocationTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Enable location to track your ride.');
        return;
      }

      locationSubscriptionRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 4000,
          distanceInterval: 15,
        },
        (location) => {
          if (!location?.coords) return;
          const coords = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          setDriverLocation(coords);
          socket.emit('driverLocation', { rideId, coords });

          const distToPickup = getDistanceMeters(coords, pickupCoords);
          const distToDrop = getDistanceMeters(coords, dropCoords);
          setIsNearPickup(distToPickup <= 500); // 50 meters threshold
          setIsNearDrop(distToDrop <= 500); // 50 meters threshold
        }
      );
    };

    startLocationTracking();

    return () => {
      if (locationSubscriptionRef.current) locationSubscriptionRef.current.remove();
    };
  }, []);


  const endRide = () => {
    // ✅ Stop location tracking
    if (locationSubscriptionRef.current) {
      locationSubscriptionRef.current.remove();
      locationSubscriptionRef.current = null;
    }

    console.log('Ending ride:', rideId);
    socket.emit('endRide', { rideId });

    // Navigate driver to end screen
    router.push('/driver/driverend');
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
          <Text style={styles.otpLabel}>Enter OTP to Start Ride:</Text>
          <TextInput
            style={styles.otpInput}
            keyboardType="numeric"
            maxLength={4}
            placeholder="••••"
            placeholderTextColor="#999"
            value={enteredOtp}
            onChangeText={(text) => {
              const digits = text.replace(/\D/g, "").slice(0, 4);
              setEnteredOtp(digits);
              if (digits.length === 4) {
                socket.emit("verifyOtp", { rideId, otp: digits }, (res) => {
                  if (res?.ok) {
                    socket.emit("riderPresent", { rideId });
                    setHasPickedUp(true);
                  } else {
                    Alert.alert("Invalid OTP", "Please enter the correct OTP.");
                    setEnteredOtp("");
                  }
                });
              }
            }}
          />
        </View>
      )}

      {hasPickedUp && isNearDrop && (
        <View style={styles.confirmContainer}>
          <TouchableOpacity style={styles.confirmButton} onPress={endRide}>
            <Text style={styles.confirmText}>End Ride 🏁</Text>
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
  otpLabel: { color: '#FFD700', fontWeight: 'bold', marginBottom: 8, fontSize: 16},
  otpInput: {   backgroundColor: 'black', color: '#FFD700', padding: 12, width: 140, textAlign: 'center', fontSize: 20, fontWeight: 'bold', letterSpacing: 6,borderRadius: 10, borderWidth: 2, borderColor: '#FFD700', marginBottom: 12},
});
