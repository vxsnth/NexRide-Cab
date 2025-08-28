import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useUser } from '../context/UserContext';
import { socket } from '../sockets/socket';

export default function BookRide() {
  const { user } = useUser();
  const router = useRouter();
  const [pickup, setPickup] = useState('');
  const [pickupCoords, setPickupCoords] = useState(null);
  const [drop, setDrop] = useState('');
  const [dropCoords, setDropCoords] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [rideType, setRideType] = useState('Mini');
  const [price, setPrice] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  const [mapPickerType, setMapPickerType] = useState(null);
  const mapRef = useRef(null);
  const isFemaleUser = user?.gender?.toLowerCase() === 'female';
  const [femaleDriverOnly, setFemaleDriverOnly] = useState(false);


  useEffect(() => {
    if (!socket.connected) socket.connect();
    socket.on('connect', () => console.log('✅ Socket connected:', socket.id));
    return () => socket.off('connect');
  }, []);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location access is required.');
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      setUserLocation(location.coords);
      let address = await Location.reverseGeocodeAsync(location.coords);
      if (address?.length > 0) {
        const { name, city, region } = address[0];
        const addrString = `${name || ''}, ${city || ''}, ${region || ''}`;
        setPickup(addrString);
        setPickupCoords(location.coords);
      }
    })();
  }, []);

  useEffect(() => {
    if (pickupCoords && dropCoords) fetchRoute(pickupCoords, dropCoords);
  }, [pickupCoords, dropCoords]);

  const fetchRoute = async (start, end) => {
    const url = `https://router.project-osrm.org/route/v1/driving/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?overview=full&geometries=geojson`;
    try {
      const res = await fetch(url);
      const json = await res.json();
      const coords = json.routes[0]?.geometry?.coordinates.map(([lng, lat]) => ({
        latitude: lat,
        longitude: lng,
      }));
      if (coords) setRouteCoords(coords);
    } catch (e) {
      console.error('Route fetch failed:', e);
    }
  };

  const handleLocationChange = async (text, type) => {
    if (type === 'pickup') setPickup(text);
    else setDrop(text);

    try {
      if (text.length > 3) {
        const geocode = await Location.geocodeAsync(text);
        if (geocode.length > 0) {
          const coords = {
            latitude: geocode[0].latitude,
            longitude: geocode[0].longitude,
          };
          if (type === 'pickup') setPickupCoords(coords);
          else setDropCoords(coords);
        }
      }
    } catch (e) {
      console.error('Geocode failed:', e);
    }
  };

  const handleConfirmMapPicker = async () => {
    const center = await mapRef.current.getCamera();
    const coords = {
      latitude: center.center.latitude,
      longitude: center.center.longitude,
    };
    try {
      const address = await Location.reverseGeocodeAsync(coords);
      const addrString = address[0]
        ? `${address[0].name || ''}, ${address[0].city || ''}, ${address[0].region || ''}`
        : 'Selected Location';
      if (mapPickerType === 'pickup') {
        setPickup(addrString);
        setPickupCoords(coords);
      } else if (mapPickerType === 'drop') {
        setDrop(addrString);
        setDropCoords(coords);
      }
      setIsMapPickerOpen(false);
      setMapPickerType(null);
    } catch (e) {
      console.error('Reverse geocode failed:', e);
    }
  };

  const openMapPicker = (type) => {
    setMapPickerType(type);
    setIsMapPickerOpen(true);
  };

  const handleGetPrice = () => {
    if (!pickup || !drop) {
      Alert.alert('Missing Info', 'Please enter pickup and drop.');
      return;
    }
    const base = { Mini: 150, Sedan: 250, SUV: 350, Auto: 100 };
    setPrice(base[rideType]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Book a Ride</Text>

      <Text style={styles.label}>Pickup Location</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={pickup}
          onChangeText={(text) => handleLocationChange(text, 'pickup')}
          placeholder="Enter pickup"
          placeholderTextColor="#999"
        />
        <TouchableOpacity onPress={() => openMapPicker('pickup')}>
          <Image source={require('../assets/pickericon.png')} style={styles.icon} />
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Drop Location</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={drop}
          onChangeText={(text) => handleLocationChange(text, 'drop')}
          placeholder="Enter drop"
          placeholderTextColor="#999"
        />
        <TouchableOpacity onPress={() => openMapPicker('drop')}>
          <Image source={require('../assets/pickericon.png')} style={styles.icon} />
        </TouchableOpacity>
      </View>

      {pickupCoords && dropCoords ? (
        <MapView
          style={{ height: 200, marginVertical: 10 }}
          initialRegion={{
            latitude: pickupCoords?.latitude ?? 12.9716,
            longitude: pickupCoords?.longitude ?? 77.5946,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          showsUserLocation={true}
        >
          <Marker coordinate={pickupCoords} title="Pickup" />
          <Marker coordinate={dropCoords} title="Drop" />
          {routeCoords.length > 0 && (
            <Polyline coordinates={routeCoords} strokeColor="#FFD700" strokeWidth={4} />
          )}
        </MapView>
      ) : (
        <Text style={{ color: 'white', textAlign: 'center', marginVertical: 10 }}>
          Waiting for pickup and drop locations to load...
        </Text>
      )}

      <View style={styles.rideOptions}>
        {['Mini', 'Sedan', 'SUV', 'Auto'].map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.rideType, rideType === type && styles.rideTypeSelected]}
            onPress={() => setRideType(type)}
          >
            <Text style={styles.rideTypeText}>{type}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {isFemaleUser && (
        <TouchableOpacity
          style={styles.femaleDriverToggle}
          onPress={() => setFemaleDriverOnly(!femaleDriverOnly)}
        >
          <View style={[styles.checkbox, femaleDriverOnly && { backgroundColor: '#FFD700' }]} />
          <Text style={styles.checkboxLabel}>Prefer Female Drivers Only</Text>
        </TouchableOpacity>
      )}


      <TouchableOpacity style={styles.priceButton} onPress={handleGetPrice}>
        <Text style={styles.buttonText}>Get Price</Text>
      </TouchableOpacity>

      {price && <Text style={styles.priceText}>Estimated Price: ₹{price}</Text>}

      <TouchableOpacity
        style={styles.bookButton}
        onPress={() => {
          if (!price) {
            Alert.alert('Get Price First', 'Please get the price before booking.');
            return;
          }
          socket.emit('rideRequest', {
            pickup,
            drop,
            price,
            rideType,
            riderSocketId: socket.id,
            name: user.name,
            pickupCoords,
            dropCoords,
          });
          router.push('/Riderwaiting');
        }}
      >
        <Text style={styles.buttonText}>Book Ride</Text>
      </TouchableOpacity>

      <Modal visible={isMapPickerOpen} animationType="slide">
        <View style={{ flex: 1 }}>
          <MapView
            ref={mapRef}
            style={{ flex: 1 }}
            initialRegion={{
              latitude: userLocation?.latitude ?? 12.9716,
              longitude: userLocation?.longitude ?? 77.5946,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            showsUserLocation={true}
          />
          <View style={styles.pinContainer}>
            <Image source={require('../assets/pin.png')} style={styles.pin} />
          </View>
          <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmMapPicker}>
            <Text style={styles.buttonText}>Confirm Location</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black', padding: 20 },
  title: { fontSize: 26, color: '#FFD700', fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  label: { color: '#FFD700', marginBottom: 4, fontSize: 16 },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  input: { flex: 1, backgroundColor: '#1c1c1e', color: 'white', padding: 12, borderRadius: 10 },
  icon: { width: 40, height: 40, marginLeft: 8 },
  rideOptions: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 16 },
  rideType: { borderWidth: 1, borderColor: '#FFD700', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },
  rideTypeSelected: { backgroundColor: '#FFD700' },
  rideTypeText: { color: 'white' },
  priceButton: { backgroundColor: '#FFD700', padding: 12, borderRadius: 10, alignItems: 'center', marginVertical: 8 },
  bookButton: { backgroundColor: '#FFD700', padding: 14, borderRadius: 10, alignItems: 'center', marginVertical: 8 },
  buttonText: { fontWeight: 'bold', color: 'black' },
  priceText: { color: 'white', fontSize: 16, textAlign: 'center', marginVertical: 10 },
  pinContainer: { position: 'absolute', top: '50%', left: '50%', marginLeft: -24, marginTop: -48 },
  pin: { width: 48, height: 48 },
  confirmButton: { backgroundColor: '#FFD700', padding: 14, alignItems: 'center' },
    femaleDriverToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#FFD700',
    marginRight: 10,
  },
  checkboxLabel: {
    color: 'white',
    fontSize: 14,
  },
});
