import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { BackHandler } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { useNavigationContainerRef } from '@react-navigation/native';
import { UserProvider } from '../context/UserContext';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    const backAction = () => {
      const currentRoute = navigationRef.getCurrentRoute()?.name;

      if (currentRoute === '(tabs)' || currentRoute === 'Home') {
        // Prevent default behavior (exit app only if needed)
        return false;
      }

      // Go back if possible
      if (navigationRef.canGoBack()) {
        navigationRef.goBack();
        return true;
      }

      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [navigationRef]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <UserProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack
            screenOptions={{
              headerShown: true,
              headerTintColor: '#FFD700',
              headerStyle: { backgroundColor: 'black' },
              headerTitle: '',
              headerTitleStyle: { color: '#FFD700' },
            }}
          >
            <Stack.Screen
              name="(tabs)"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="+not-found"
              options={{ title: 'Not Found' }}
            />
          </Stack>
          <StatusBar style="light" translucent backgroundColor="transparent" />
        </ThemeProvider>
      </UserProvider>
    </GestureHandlerRootView>
  );
}
