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
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useUser } from '../context/UserContext';

export default function SignupScreen() {
  const router = useRouter();
  const { setUser } = useUser(); 

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other' | null>(null);
  const [role, setRole] = useState<'rider' | 'driver' | null>(null);

  const handleSignup = () => {
    if (!gender) {
      alert('Please select your gender');
      return;
    }

    if (!role) {
      alert('Please select Rider or Driver');
      return;
    }

    setUser({
      name,
      email,
      gender,
      role,
      avatar: require('../assets/user.jpg'),
    });

    if (role === 'driver') {
      router.replace('../driver/RegisterDriver');
    } else {
      router.replace('/thirdpage'); 
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <Text style={styles.title}>Create Account</Text>

        <TextInput
          placeholder="Name"
          placeholderTextColor="#FFD966"
          style={styles.input}
          value={name}
          onChangeText={setName}
        />
        <TextInput
          placeholder="Email"
          placeholderTextColor="#FFD966"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
        <TextInput
          placeholder="Password"
          placeholderTextColor="#FFD966"
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Text style={styles.genderLabel}>Select Gender</Text>
        <View style={styles.genderContainer}>
          {['Male', 'Female', 'Other'].map((g) => (
            <Pressable
              key={g}
              style={[
                styles.genderButton,
                gender === g && styles.genderButtonSelected,
              ]}
              onPress={() => setGender(g as typeof gender)}
            >
              <Text
                style={[
                  styles.genderText,
                  gender === g && styles.genderTextSelected,
                ]}
              >
                {g}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.genderLabel}>Sign up as</Text>
        <View style={styles.genderContainer}>
          {['rider', 'driver'].map((r) => (
            <Pressable
              key={r}
              style={[
                styles.genderButton,
                role === r && styles.genderButtonSelected,
              ]}
              onPress={() => setRole(r as 'rider' | 'driver')}
            >
              <Text
                style={[
                  styles.genderText,
                  role === r && styles.genderTextSelected,
                ]}
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable onPress={handleSignup} style={styles.button}>
          <Text style={styles.buttonText}>Sign Up</Text>
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
  genderLabel: {
    color: '#FFD966',
    fontSize: 18,
    fontFamily: 'System',
    marginBottom: 12,
    textAlign: 'center',
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 32,
  },
  genderButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFD966',
  },
  genderButtonSelected: {
    backgroundColor: '#FFD966',
  },
  genderText: {
    color: '#FFD966',
    fontFamily: 'System',
    fontSize: 14,
  },
  genderTextSelected: {
    color: 'black',
  },
  button: {
    backgroundColor: '#FFD966',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: 'black',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'System',
  },
});
