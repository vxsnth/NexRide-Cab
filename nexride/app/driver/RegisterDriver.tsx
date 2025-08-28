import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableWithoutFeedback
} from 'react-native';
import { useUser } from '../../context/UserContext';

export default function RegisterDriver() {
  const router = useRouter();
  const { user, setUser } = useUser();

  const [experience, setExperience] = useState('');
  const [phone, setPhone] = useState('');

  const handleContinue = () => {
    if (!experience || !phone) {
      alert('Please fill in both fields');
      return;
    }

    setUser({
      ...user,
      experience,
      phone,
    });

    router.replace('/driver/DriverHome'); 
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Text style={styles.title}>Driver Registration</Text>

        <TextInput
          placeholder="Driving Experience (in years)"
          placeholderTextColor="#FFD966"
          style={styles.input}
          value={experience}
          onChangeText={setExperience}
          keyboardType="numeric"
        />

        <TextInput
          placeholder="Phone Number"
          placeholderTextColor="#FFD966"
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <Pressable style={styles.button} onPress={handleContinue}>
          <Text style={styles.buttonText}>Continue</Text>
        </Pressable>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
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
    fontSize: 28,
    color: '#FFD966',
    fontWeight: 'bold',
    marginBottom: 40,
    fontFamily: 'Elephant',
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
    fontFamily: 'Elephant',
  },
  button: {
    backgroundColor: '#FFD966',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: 'black',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Elephant',
  },
});
