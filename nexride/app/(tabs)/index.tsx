import { Video } from 'expo-av';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';

export default function IntroScreen() {
  const videoOpacity = useRef(new Animated.Value(1)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const [videoEnded, setVideoEnded] = useState(false);
  const router = useRouter();

  const handleVideoEnd = () => {
    Animated.timing(videoOpacity, {
      toValue: 0,
      duration: 500, 
      useNativeDriver: true,
    }).start(() => {
      setVideoEnded(true);
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 600, 
        useNativeDriver: true,
      }).start(() => {
        setTimeout(() => {
          router.replace('/2ndpage');
        }, 3000); 
      });
    });
  };

  return (
    <View style={styles.container}>
      {!videoEnded && (
        <Animated.View style={{ ...StyleSheet.absoluteFillObject, opacity: videoOpacity, zIndex: 2 }}>
          <Video
          source={require('../../assets/animation.mp4')}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          shouldPlay
          isLooping={false}
          isMuted
          rate={1.8} 
          onPlaybackStatusUpdate={(status) => {
          if (status.didJustFinish) {
          handleVideoEnd();
    }
  }}
/>

        </Animated.View>
      )}

      <Animated.View style={[styles.logoContainer, { opacity: logoOpacity, zIndex: 3 }]}>
        <Image
          source={require('../../assets/full.jpg')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Image
          source={require('../../assets/tagline.jpg')}
          style={styles.tagline}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    position: 'absolute',
    top: 0,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
 logo: {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  resizeMode: 'cover', 
},

  tagline: {
  position: 'absolute',
  bottom: '15%',      
  width: '80%',
  height: undefined,
  aspectRatio: 5.5,    
  resizeMode: 'contain',
},

});
