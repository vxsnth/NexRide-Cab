import { useRouter } from 'expo-router';
import { Image, Pressable, StyleSheet, View } from 'react-native';

export default function AuthScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Pressable onPress={() => router.push('/signup')}>
        <Image
          source={require('.././assets/signup.jpg')}
          style={styles.button}
          resizeMode="contain"
        />
      </Pressable>

      <Pressable onPress={() => router.push('/login')}>
        <Image
          source={require('.././assets/login.jpg')}
          style={styles.button}
          resizeMode="contain"
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 100, 
  },
  button: {
    width: 450,  
    height: 200, 
  },
});
