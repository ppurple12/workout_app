import { View, Image, StyleSheet, Button, Platform, Text, TextInput, TouchableOpacity, } from 'react-native';

import { TabParamList } from '@/types/navigation'; // Adjust path as needed

import { Canvas } from '@react-three/fiber';
import {Link} from'expo-router';
import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

import { RootStackParamList } from '../../types/navigation';
import { useRouter } from 'expo-router';

export default function Home() {
  const router = useRouter();
  const handleSubmit = () => {
    
    router.push('/body/Model')
    //window.location.href="../body/Model";
  };
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#7d2917', dark: '#7d2917' }}
      headerImage={
        <View style={styles.headerContainer}>
          
          <Image
            source={require('@/assets/images/gym.png')}
            style={styles.gymImage} // Set opacity for semi-transparent image
          />
          <Image
            source={require('@/assets/images/logo-workout.png')}
            style={styles.reactLogo}
          />
        </View>
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Welcome!</ThemedText>
        <HelloWave />
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Start Workout</Text>
        </TouchableOpacity>
      </ThemedView>
    </ParallaxScrollView>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    position: 'relative', // Allows logo to overlay on top of the gym image
    height: 250, // Set the height of your header
    color: '#7d2917',
  },
  gymImage: {
    position: 'absolute', // Allows the image to stretch and fill the header
    width: '100%', // Takes up the full width of the header
    height: '100%', // Takes up the full height of the header
    resizeMode: 'cover', // Ensures the image covers the entire header without distortion
    opacity: 0.4, // Make the image semi-transparent if desired
  },
  buttonText: {
    color: '#fff', // White text color for contrast
    fontSize: 16,
    fontWeight: 'bold',
  },
  reactLogo: {
    position: 'absolute', // Places the logo on top of the gym image
    width: 400,
    height: 400,
    top: -30, // Adjust positioning of the logo
    left: -70, // Adjust positioning of the logo
  },
  submitButton: {
    backgroundColor: '#7d2917', // Red background
    padding: 12,
    borderRadius: 5,
    width: '100%', // Ensure full width
    alignItems: 'center', // Center the text horizontally
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    color: '#7d2917',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
    color: '#7d2917',
  },
});