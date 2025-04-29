import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import DraggableFlatList from 'react-native-draggable-flatlist';
import csvData from '../../components/gra/qMatrix.csv';

const Calculate = () => {
    const [muscleValues, setMuscleValues] = useState<number[]>([]);
    const [amount, setAmount] = useState<number>(0);
    const [error, setError] = useState<string | null>(null);
    const [exercises, setExercises] = useState<string[]>([]);
    const [uniqueRowValues, setUniqueRowValues] = useState<number[]>([]);
    const [exerciseNames, setExerciseNames] = useState<string[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [tpairs, setTPairs] = useState<[number, number][]>([]);
    const [tMatrix, setTMatrix] = useState<number[][]>([]); // New T_matrix state
    const [workoutGenerated, setWorkoutGenerated] = useState(false);

    const router = useRouter();
    const { calculatedValues: muscleValuesString, amount: amountString } = useLocalSearchParams();

    useEffect(() => {
        // Function to fetch and set muscle values
        const fetchMuscleValues = () => {
            console.log('Fetching muscle values...');
            console.log('muscleValuesString:', muscleValuesString);
            if (typeof muscleValuesString === 'string' && muscleValuesString.trim() !== '') {
                // Clean up the string: remove unwanted characters like brackets and extra spaces
                const cleanedString = muscleValuesString.replace(/[\[\]\s]/g, ''); // remove brackets and extra spaces
                console.log('Cleaned muscleValuesString:', cleanedString);
            
                // Split the cleaned string and convert to numbers
                const muscleValuesArray = cleanedString.split(',').map((value) => {
                    const num = Number(value.trim());
            
                    // Validate if the value is a valid number and >= 0
                    if (isNaN(num) || num < 0) {
                        console.warn(`Invalid value found: "${value}". Replacing with 0.`);
                        return 0;  // Replace invalid or negative values with 0
                    }
            
                    return num; // Return valid number
                });
            
                console.log('Muscle values set:', muscleValuesArray);
                setMuscleValues(muscleValuesArray);
            } 
            if (amountString) {
                setAmount(Number(amountString));
                console.log('Amount set:', amountString);
            }
        };
    
        // Function to fetch exercises
        const fetchExercises = async () => {
            console.log('Fetching exercises...');
            try {
                const response = await fetch(csvData);
                console.log('Response status:', response.status);
    
                if (!response.ok) {
                    throw new Error('Failed to fetch CSV');
                }
    
                const text = await response.text();
                console.log('CSV content:', text);
    
                const rows = text.split('\n').slice(1); // Assuming first row is header
                console.log('Rows after splitting by new line:', rows);
    
                const exerciseNames = rows
                    .map(row => {
                        const columns = row.split(',');
                        const name = columns[0]?.trim(); // Assuming the name is the first column
                        return name;
                    })
                    .filter(exercise => exercise !== '');
    
                console.log('Filtered exercise names:', exerciseNames);
                setExercises(exerciseNames);
                console.log('Exercises fetched:', exerciseNames);
    
                // Initialize T_matrix based on exercise count
                setTMatrix(Array(exerciseNames.length).fill(0).map(() => Array(muscleValues.length).fill(0)));
                console.log('T_matrix initialized with size:', exerciseNames.length, 'x', muscleValues.length);
                
            } catch (err) {
                console.error('Error fetching exercises:', err);
                setError('Failed to fetch exercises. Please try again later.');
            }
        };
    
        fetchMuscleValues();
        fetchExercises();
    }, []); // This useEffect will run once on component mount
    

    const callApi = async () => {
        console.log('Calling API with muscleValues:', muscleValues, 'and amount:', amount);
        setLoading(true);
        try {
            const response = await fetch('http://localhost:5000/api/gmra', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ L: muscleValues, amount }),
            });

            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }

            const data: { T_pairs: [number, number][]; T_matrix: number[][]; status: string } = await response.json();
            console.log('API response received:', data);

            if (data.T_pairs) {
                const uniqueRows = [...new Set(data.T_pairs.map(pair => pair[0]))];
                setUniqueRowValues(uniqueRows);
                displayExerciseNames(uniqueRows);
                setTPairs(data.T_pairs);
                setTMatrix(data.T_matrix);
                console.log('T_pairs and T_matrix set');
            } else {
                setError('API response did not contain T_pairs.');
                console.warn('API response did not contain T_pairs.');
            }
        } catch (err) {
            console.error('Error calling API:', err);
            setError('Failed to call API. Please try again later.');
        } finally {
            setWorkoutGenerated(true); // Mark workout as generated
            setLoading(false);
        }
    };

    const next = () => {
        console.log('Proceeding to the next step...');
        router.push({
            pathname: '/body/workout',
            params: {
              tMatrix: JSON.stringify(tMatrix), // Pass the result array as a JSON string
            },
          });
        // Handle logic for the next action (like navigating to a new screen or performing another action)
    };

    const displayExerciseNames = (uniqueRows: number[]) => {
        
        console.log('Displaying exercise names for unique rows:', uniqueRows);
        console.log('Exercise Names:', exerciseNames);
        const names = uniqueRows.map(row => {
            const exercise = exercises[row];
            return exercise;
        });

        setExerciseNames(names);
        console.log('Exercise names displayed:', names);
    };

    const shuffleSpecificExercise = async (index: number) => {
        console.log(`Shuffling exercise at index: ${index}`);
        try {
            const response = await fetch('http://localhost:5000/api/shuffle', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    muscle_index: index,
                    T_matrix: tMatrix,
                    muscle_name: exerciseNames[index],
                }),
            });

            if (!response.ok) {
                throw new Error(`Shuffle request failed with status ${response.status}`);
            }

            const data = await response.json();
            console.log('Shuffle API response received:', data);

            const newIndex = data.most_similar_index;
            const newExerciseName = data.new_exercise_name;
            setTMatrix(data.T_matrix);
            console.log('Updated T_matrix:', data.T_matrix);

            if (newExerciseName) {
                setExerciseNames(prevNames => {
                    const newNames = [...prevNames];
                    newNames[index] = newExerciseName;
                    return newNames;
                });
                console.log(`Updated exercise name at index ${index}:`, newExerciseName);

                setUniqueRowValues(prevRows => {
                    const updatedRows = [...prevRows];
                    const position = updatedRows.indexOf(index);
                    updatedRows[position] = newIndex;
                    return updatedRows;
                });
                console.log('Updated unique row values:', uniqueRowValues);
            } else {
                console.warn('No similar exercise found or name not returned.');
                setError('No similar exercise found or name not returned.');
            }
        } catch (err) {
            console.error('Error shuffling exercise:', err);
            setError('An error occurred while shuffling the exercise. Please try again later.');
        }
    };


    return (
        <View style={styles.container}>
            <Text style={styles.title}>Your exercises:</Text>  
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                {exerciseNames.length > 0 ? (
                    exerciseNames.map((name, index) => (
                        <View key={index} style={styles.exerciseCard}>
                            
                                <Text style={styles.exercise}>{name}</Text>
                                <TouchableOpacity
                                    style={styles.fab}
                                    onPress={() => shuffleSpecificExercise(index)}
                                >
                                    <MaterialCommunityIcons
                                        name="shuffle-variant"
                                        size={24}
                                        color="#fff"
                                    />
                                </TouchableOpacity>
                           
                            
                        </View>
                    ))
                ) : (
                    <Text style={styles.noExercises}>No workout begun.</Text>
                )}
            </ScrollView>

            {error && <Text style={styles.error}>{error}</Text>}

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#7d2917" />
                    <Text style={styles.loadingText}>Loading...</Text>
                </View>
            ) : (
                 <View style={styles.buttonContainer}>
                    {/* Conditionally render the button based on whether the workout has been generated */}
                    {workoutGenerated ? (
                        <Button title="Next" onPress={next} color="#7d2917" />
                    ) : (
                        <Button title="Generate Workout" onPress={callApi} color="#7d2917" />
                    )}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#151718',
    },
    scrollContainer: {
        justifyContent: 'flex-start',  // Apply justifyContent to the contentContainerStyle of ScrollView
        flexDirection: 'column',  // Ensure content flows vertically
        alignItems: 'stretch',  // Align items to stretch the full width of the container
        paddingBottom: 20, // Add padding if necessary

        
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
        color: "#fff"
    },
    exerciseCard: {
        backgroundColor: '#737272',
        padding: 15,
        borderRadius: 10,
        marginVertical: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 5,
        marginRight: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        minHeight: 125,  // Ensure each card has enough vertical height
        flexGrow: 1,  // Allow card to grow and take up available vertical space
        width: '100%', // Take full width available
    },
    
    exercise: {
        fontSize: 18,
        marginBottom: 10,
        fontWeight: '600',
        flex: 1, // Allow exercise text to grow and occupy available space
    
    },
    fab: {
        backgroundColor: '#4caf50',
        borderRadius: 50,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        width: 125, // Set a fixed size for the button
        height: 75, // Maintain the circular shape of the button
        marginRight: 20, // Ensure some space between the exercise text and the button
        marginBottom: 0,
    },
    fabText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    pairText: {
        fontSize: 14,
        color: 'blue',
    },
    noExercises: {
        fontSize: 18,
        color: 'gray',
    },
    error: {
        color: 'red',
        marginBottom: 10,
    },
    buttonContainer: {
        marginTop: 20,
        alignItems: 'center',
    },
    generateContainer: {
        marginTop: 20,
        alignItems: 'center',
    },
    loadingContainer: {
        alignItems: 'center',
        marginVertical: 20,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 18,
    },
});

export default Calculate;

