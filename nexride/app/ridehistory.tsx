import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function RideHistory() {
  const [rides, setRides] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const loadRides = async () => {
      try {
        const data = await AsyncStorage.getItem('rideHistory');
        if (data) {
          setRides(JSON.parse(data));
        } else {
          const defaultRides = [
            {
              id: '1',
              date: 'June 12, 2025 - 2:30 PM',
              pickup: 'Connaught Place',
              drop: 'IGI Airport',
              fare: 'Rs. 320',
            },
          ];
          await AsyncStorage.setItem('rideHistory', JSON.stringify(defaultRides));
          setRides(defaultRides);
        }
      } catch (error) {
        Alert.alert('Error', 'Could not load ride history');
      }
    };

    loadRides();
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push({ pathname: '/ridedetail', params: { ...item } })}
    >
      <Text style={styles.date}>{item.date}</Text>

      <View style={styles.row}>
        <FontAwesome5 name="map-marker-alt" size={16} color="#FFD700" />
        <Text style={styles.location}> From: {item.pickup}</Text>
      </View>

      <View style={styles.row}>
        <FontAwesome5 name="location-arrow" size={16} color="#FFD700" />
        <Text style={styles.location}> To: {item.drop}</Text>
      </View>

      <Text style={styles.fare}>Fare: {item.fare}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ride History</Text>
      <FlatList
        data={rides}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    padding: 20,
    paddingTop: 50,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 20,
    alignSelf: 'center',
  },
  card: {
    backgroundColor: '#1a1a1a',
    padding: 18,
    borderRadius: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
  },
  date: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  location: {
    color: '#ccc',
    fontSize: 14,
    marginLeft: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  fare: {
    color: 'white',
    fontWeight: 'bold',
    marginTop: 6,
    fontSize: 15,
  },
});
