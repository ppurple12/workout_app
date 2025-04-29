// Model.tsx
import React, { useState } from 'react';
import { View, Button, StyleSheet, Dimensions, TouchableOpacity} from 'react-native';
import { Canvas } from '@react-three/fiber';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

 // Import the navigation type

import Box from '../../components/ModelViewer'; // Ensure this is the correct path

const Model = () => {

  const [muscleValues, setMuscleValues] = useState<number[]>(Array(6).fill(0));
  const [rotationY, setRotationY] = useState(0);
  const router = useRouter();
  // Function to handle submit and navigate using href
  const handleSubmit = () => {
    const muscleValuesString = JSON.stringify(muscleValues);
    router.push({
      pathname: '/body/amount',
      params: {
        muscleValues: muscleValuesString},
    });
   
  };
 // Function to handle rotation
 const handleRotate = () => {
  setRotationY((prevRotation) => {
    const newRotation = prevRotation + Math.PI ;  // Increment rotation by 45 degrees
    console.log('New rotationY:', newRotation);  // Log the new rotation
    return newRotation;  // Return the updated value
  });
};


return (
  <View style={styles.container}>
    <Canvas camera={{ position: [0, 1, 5], fov: 50 }} style={styles.canvas}>
      <ambientLight />
      <pointLight position={[10, 10, 10]} />
      <Box rotationY={rotationY} onMuscleValuesChange={setMuscleValues} />
    </Canvas>

    <View style={styles.buttonContainer}>
      <Button onPress={handleSubmit} title="Submit" color="#7d2917" />
    </View>
    <TouchableOpacity style={styles.fab} onPress={handleRotate}>
        <MaterialCommunityIcons name="rotate-360" size={40} color="white" />
    </TouchableOpacity>
  </View>
);
};

// Style Definitions
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#151718',
    height: '100%',
    width: '100%',
  },
  buttonContainer: {
    marginBottom: 20,
  },
  canvas: {
    flex: 1,
    width: Dimensions.get('window').width, // Full width of the window
    height: Dimensions.get('window').height * 0.8, // 80% height of the window
  },
  fab: {
    position: 'absolute',
    right: 120, // Positioned slightly off the right edge of the screen
    bottom: 120, // Placed above the screen's bottom for better visibility
    backgroundColor: '#FF5733', // FAB color
    borderRadius: 50,
    padding: 20,
    elevation: 6, // Shadow for elevation effect
    alignItems: 'center',
    width: 120,
    justifyContent: 'center',
    zIndex: 1000, // Ensure it's on top of other content
    shadowColor: "#000", // Shadow color
    shadowOffset: { width: 0, height: 2 }, // Shadow offset
    shadowOpacity: 0.25, // Shadow opacity
    shadowRadius: 4, // Shadow radius
  },
});

export default Model;