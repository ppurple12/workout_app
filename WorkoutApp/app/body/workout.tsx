import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Button, Animated, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import csvData from '../../components/gra/qMatrix.csv';

const getNonZeroRowIndices = (matrix: number[][]) => {
  return matrix
    .map((row, index) => ({ row, index })) // Pair rows with their indices
    .filter(({ row }) => {
      const isNonZero = row.some(value => value !== 0); // Check for non-zero
      if (!isNonZero) console.log('Skipping all-zero row:', row);
      return isNonZero;
    })
    .map(({ index }) => index); // Return indices of non-zero rows
};

const getHighestValueIndex = (row: number[]) => {
  if (!row || row.length === 0) {
    console.error('Invalid or empty row passed to getHighestValueIndex:', row);
    return -1; // Return -1 for invalid rows
  }

  //console.log('Processing row in getHighestValueIndex:', row);

  let maxValue = -Infinity;
  let maxIndex = -1;

  row.forEach((value, index) => {
    //console.log(`Checking value ${value} at index ${index}`);
    if (value > maxValue) {
      maxValue = value;
      maxIndex = index;
      //console.log(`New maxValue: ${maxValue}, maxIndex: ${maxIndex}`);
    }
  });

  if (maxIndex === 5) {
    //console.log('Adjusting maxIndex from 5 to 3');
    maxIndex = 3;
  }

  //console.log('Returning maxIndex:', maxIndex);
  return maxIndex;
};


const classifyMuscles = (row: number[], headers: string[]) => {
  const primaryMuscles: string[] = [];
  const secondaryMuscles: string[] = [];
  console.log(row)
  // Check if row is defined and is an array
  if (!row || !Array.isArray(row)) {
    console.error("Invalid row data:", row);
    return { primaryMuscles, secondaryMuscles };
  }

  row.forEach((value, index) => {
    if (value >= 0.4) {
      primaryMuscles.push(headers[index+1]);
    } else if (value > 0) {
      secondaryMuscles.push(headers[index+1]);
    }
  });

  return { primaryMuscles, secondaryMuscles };
};

const Workout = () => {
  const router = useRouter();
  const { tMatrix: rawTMatrix } = useLocalSearchParams();
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [exerciseNames, setExerciseNames] = useState<string[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [qMatrix, setQMatrix] = useState<number[][]>([]);
  const [opacity] = useState(new Animated.Value(1)); // For fade in/out animation
  const [uniqueRowValues, setUniqueRowValues] = useState<number[]>([]);
  const [muscleNames, setMuscleNames] = useState<string[]>([]);

  useEffect(() => {
    console.log('Workout component loaded');
    console.log('rawTMatrix:', rawTMatrix);

    // Fetch exercises only once
    const fetchExercises = async () => {
      console.log('Fetching exercises...');
      try {
        const response = await fetch(csvData);
        if (!response.ok) throw new Error('Failed to fetch CSV');

        const text = await response.text();
        const rows = text.split('\n').slice(1); // Skip header
        const header = text.split('\n')[0]; // Extract only the header
        const headerFields = header.split(',').map(field => field.trim()); // Split and trim the fields
        setMuscleNames(headerFields);

        const names = rows
          .map(row => row.split(',')[0]?.trim())
          .filter(name => name !== '');

        
        const qMatrix = rows
        .map(row => row.split(',').slice(1).map(value => parseFloat(value.trim()) || 0)); // Extract all columns except the first

        console.log('Exercise names fetched:', names);
        setExerciseNames(names);
        setQMatrix(qMatrix);
      } catch (err) {
        console.error('Error fetching exercises:', err);
      }
    };

    fetchExercises();
  }, []); // Runs only once.

  
  // Process rawTMatrix and fetch data when both rawTMatrix and exerciseNames are available
  useEffect(() => {
    const processMatrix = async () => {
      if (rawTMatrix && exerciseNames.length > 0) { // Only process if rawTMatrix and exerciseNames are available
        console.log('Processing tMatrix:', rawTMatrix);

        try {
          // Parse the matrix
          const parsedTMatrix: number[][] =
            typeof rawTMatrix === 'string' ? JSON.parse(rawTMatrix) : rawTMatrix;
          console.log('Parsed Matrix:', parsedTMatrix);

          // Filter out zero rows (rows where every element is 0)
          const filteredMatrix: number[][] = parsedTMatrix.filter((row: number[]) => row.some(value => value !== 0));
          console.log('Filtered Matrix (no zero rows):', filteredMatrix);

          // Get unique row indices
          const uniqueRowIndices = getNonZeroRowIndices(parsedTMatrix);
          const exercisesToShow = uniqueRowIndices.map(index => {
            return exerciseNames[index] || `Exercise ${index + 1}`;
          });

          console.log('Selected exercises:', exercisesToShow);
          setSelectedExercises(exercisesToShow);
          console.log('Unique row indices:', uniqueRowIndices);

          // Call the API
          const response = await fetch('http://localhost:5000/api/spaceout', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ parsedTMatrix: filteredMatrix, uniqueRowIndices }),
          });

          if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
          }

          const { balancedTmatrix, reorderedIndices } = await response.json();
          setUniqueRowValues(reorderedIndices);

          console.log('Reordered Indices:', uniqueRowIndices);
        } catch (error) {
          console.error('Error processing matrix:', error);
        }
      }
    };

    processMatrix();
  }, [rawTMatrix, exerciseNames]); // Depend on rawTMatrix and exerciseNames// Dependency array to run effect when rawTMatrix changes

  const handleNextOrExit = () => {
    if (currentExerciseIndex < selectedExercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      console.log(`Moved to next exercise. New index: ${currentExerciseIndex + 1}`);
    } else {
      console.log('Reached end. Navigating back to index page.');
      router.push('/');  // Navigate back to index page
    }
  };

  const handlePrevious = () => {
    console.log(
      `Current index: ${currentExerciseIndex}, total exercises: ${selectedExercises.length}`
    );
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(currentExerciseIndex - 1);
      console.log(`Moved to previous exercise. New index: ${currentExerciseIndex - 1}`);
    } else {
      console.log('No previous exercises.');
    }
  };

  // Handle the fade-in/out transition
  const fadeInOut = () => {
    Animated.sequence([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  //Only call classifyMuscles if qMatrix and uniqueRowValues are populated
  const { primaryMuscles, secondaryMuscles } = (qMatrix.length > 0 && uniqueRowValues.length > 0) 
    ? classifyMuscles(qMatrix[uniqueRowValues[currentExerciseIndex]], muscleNames) 
    : { primaryMuscles: [], secondaryMuscles: [] }; 


  const getExerciseIcon = (index: number) => {
    const exerciseIcons: Record<number, any> = {
      0: require('@/assets/images/index0.png'),
      1: require('@/assets/images/index1.png'),
      2: require('@/assets/images/index2.png'),
      3: require('@/assets/images/index3.png'),
      4: require('@/assets/images/index4.png'),
      5: require('@/assets/images/index3.png'),
      6: require('@/assets/images/index6.png'),
      7: require('@/assets/images/index7.png'),
      8: require('@/assets/images/index8.png'),
      9: require('@/assets/images/index9.png'),
      10: require('@/assets/images/index10.png'),
      11: require('@/assets/images/index11.png'),
    };
  
    const row = qMatrix[uniqueRowValues[index]]; // Get the row (exercise)
    const highestIndex = getHighestValueIndex(row); // Get the index of the highest value
    console.log(exerciseNames[uniqueRowValues[index]])
    if (highestIndex in exerciseIcons) {
      return exerciseIcons[highestIndex];
    } else {
      console.warn(`No icon found for index ${highestIndex}, using fallback.`);
      return require('@/assets/images/logo-workout.png'); // Fallback image
    }
  };
  return (
    <View style={styles.pageContainer}>
      <View style={styles.container}>
        {selectedExercises.length > 0 ? (
          <>
            <Animated.View style={[styles.card, { opacity }]}>
              <Text style={styles.exerciseTitle}>
                {exerciseNames[uniqueRowValues[currentExerciseIndex]]}
              </Text>
              <Image
                source={getExerciseIcon(currentExerciseIndex)} // Adjust image path
                style={styles.exerciseImage}
              />

              {/* Display Primary Muscles */}
              <Text style={styles.subtitle}>Primary Muscles:</Text>
              {primaryMuscles.length > 0 ? (
                primaryMuscles.map((muscle, idx) => (
                  <Text key={`primary-${idx}`} style={styles.muscleText}>
                    {muscle}
                  </Text>
                ))
              ) : (
                <Text style={styles.muscleText}>None</Text>
              )}

              {/* Display Secondary Muscles */}
              <Text style={styles.subtitle}>Secondary Muscles:</Text>
              {secondaryMuscles.length > 0 ? (
                secondaryMuscles.map((muscle, idx) => (
                  <Text key={`secondary-${idx}`} style={styles.muscleText}>
                    {muscle}
                  </Text>
                ))
              ) : (
                <Text style={styles.muscleText}>None</Text>
              )}       
              
            </Animated.View>

            {/* Previous Exercise */}
            {currentExerciseIndex > 0 && (
              <Animated.View style={[styles.backgroundExercise, { left: -250 }]}>
                <Text style={styles.backgroundText}>
                  {exerciseNames[uniqueRowValues[currentExerciseIndex-1]]}
                </Text>
                <Image
                  source={getExerciseIcon(currentExerciseIndex - 1)} // Adjust image path
                  style={styles.exerciseImage}
                />
              </Animated.View>
            )}

            {/* Next Exercise */}
            {currentExerciseIndex < selectedExercises.length - 1 && (
              <Animated.View style={[styles.backgroundExercise, { right: -250 }]}>
                <Text style={styles.backgroundText}>
                  {exerciseNames[uniqueRowValues[currentExerciseIndex+1]]}
                </Text>
                <Image
                  source={getExerciseIcon(currentExerciseIndex + 1)} // Adjust image path
                  style={styles.exerciseImage}
                />
              </Animated.View>
            )}

            <View style={styles.buttonsContainer}>
              <Button color='#7d2917' title="Previous" onPress={() => {
                fadeInOut();
                handlePrevious();
              }} />
              <Button color='#7d2917' title="Next" onPress={() => {
                fadeInOut();
                handleNextOrExit();
              }} />
            </View>
          </>
        ) : (
          <Text style={styles.message}>Loading exercises...</Text>
        )}
      </View>
    </View>
  );
};
// Style Definitions using StyleSheet
const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#151718', // Grey background
    padding: 20,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#151718',
    position: 'relative',
  },
  
  backgroundExercise: {
    position: 'absolute',
    top: 0,
    zIndex: -1, // Put in the background
    opacity: 0.7,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    width: 300, // Fixed width for the background exercises
    height: '20%', // Fixed height for the background exercises
  },
  backgroundText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 30,
    marginBottom: 20,
    borderRadius: 20,
    elevation: 5, // Android shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6, // iOS shadow
    justifyContent: 'center',
    alignItems: 'center',
    width: 550,
    height: '60%',
 },
 exerciseTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
 },
  buttonsContainer: {
    flexDirection: 'row',
    marginTop: 20,
    justifyContent: 'space-between',
    width: 300,
    color: '#737272'
  },
  message: {
    fontSize: 18,
    color: 'gray',
  },
  exerciseImage: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
    alignItems: 'center'
  }, 
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
  },
  muscleText: {
    fontSize: 16,
    marginVertical: 4,
  },
});

export default Workout;