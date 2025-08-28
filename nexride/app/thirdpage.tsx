import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';

export default function ThirdPage() {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const pulse = useSharedValue(1);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location access is required.');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
      setLoading(false);
    })();
    pulse.value = withRepeat(withTiming(2.5, { duration: 1200 }), -1, true);
  }, []);

  const pulseStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulse.value }],
      opacity: 2.5 - pulse.value,
    };
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={{ color: 'white', marginTop: 10 }}>Fetching your location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* User Avatar (Top Right) */}
      <View style={styles.accountContainer}>
        <TouchableOpacity onPress={() => router.push('/account')}>
          <Image source={require('../assets/user.jpg')} style={styles.userImage} />
        </TouchableOpacity>
      </View>

      {/* Map */}
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }}
      >
        <Marker coordinate={{ latitude: location.latitude, longitude: location.longitude }}>
          <View style={{ alignItems: 'center' }}>
            <Animated.View style={[styles.pulseCircle, pulseStyle]} />
            <Image
              source={require('../assets/first.jpg')}
              style={styles.markerImage}
            />
            <Text style={styles.markerText}>You are here</Text>
          </View>
        </Marker>
      </MapView>

      {/* Bottom Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/bookride')}>
          <Text style={styles.buttonText}>Book a Ride</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => router.push('/ridehistory')}>
          <Text style={styles.buttonText}>Ride History</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountContainer: {
  position: 'absolute',
  top: 50,
  right: 20,
  zIndex: 10,
},
userImage: {
  width: 80,          
  height: 80,
  borderRadius: 40,
  borderWidth: 2,
  borderColor: '#FFD700', 
},
  map: {
    flex: 1,
  },
  pulseCircle: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 215, 0, 0.4)',
    zIndex: -1,
  },
  markerImage: {
  width: 50,
  height: 50,
  borderRadius: 12, 
  borderWidth: 2,
  borderColor: '#FFD700', 
},
  markerText: {
    marginTop: 4,
    color: '#FFD700',
    fontWeight: 'bold',
    fontSize: 12,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    paddingHorizontal: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    backgroundColor: '#FFD700',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
    shadowColor: '#fff',
    elevation: 4,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
  },
});
