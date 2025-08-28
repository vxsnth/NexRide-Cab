import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useUser } from '../context/UserContext';

export default function LoginScreen() {
  const router = useRouter();
  const { setUser } = useUser(); 

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if (!identifier || !password) {
      alert('Please fill in all fields');
      return;
    }

    const mockUser = {
      name: 'John Doe',
      email: identifier,
      gender: 'Male',
      avatar: require('.././assets/user.jpg'), 
    };

    
    setUser(mockUser);
    
    router.replace('/thirdpage');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <Text style={styles.title}>Log In</Text>

      <TextInput
        placeholder="Username or Email"
        placeholderTextColor="#FFD966"
        style={styles.input}
        value={identifier}
        onChangeText={setIdentifier}
      />

      <TextInput
        placeholder="Password"
        placeholderTextColor="#FFD966"
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Pressable onPress={handleLogin} style={styles.button}>
        <Text style={styles.buttonText}>Submit</Text>
      </Pressable>

      <TouchableOpacity onPress={() => alert('Reset password functionality coming soon!')}>
        <Text style={styles.link}>Forgot Password?</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/signup')}>
        <Text style={styles.link}>Create New Account</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    padding: 32,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    color: '#FFD966',
    fontWeight: 'bold',
    marginBottom: 40,
    fontFamily: 'System',
    textAlign: 'center',
  },
  input: {
    borderWidth: 2,
    borderColor: '#FFD966',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    color: '#FFD966',
    fontSize: 16,
    fontFamily: 'System',
  },
  button: {
    backgroundColor: '#FFD966',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  buttonText: {
    color: 'black',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'System',
  },
  link: {
    color: '#FFD966',
    textAlign: 'center',
    fontSize: 16,
    fontFamily: 'System',
    marginTop: 8,
    textDecorationLine: 'underline',
  },
});
