import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

const Amount = () => {
  const [amount, setAmount] = useState<number>(1);
  const router = useRouter();
  const { muscleValues: muscleValuesString } = useLocalSearchParams();
  const [muscleValues, setMuscleValues] = useState<number[]>([]);

  useEffect(() => {
    if (muscleValuesString) {
      try {
        // If muscleValuesString is an array, we need to handle it by joining and parsing
        const values = Array.isArray(muscleValuesString)
          ? muscleValuesString[0]  // Assuming the array has only one value
          : muscleValuesString;    // If it's just a single string

        const parsedValues = JSON.parse(values);
        setMuscleValues(parsedValues);
      } catch (error) {
        console.error('Error parsing muscleValues:', error);
      }
    }
  }, [muscleValuesString]);

  const handleSubmit = () => {
    const resultArray = muscleValues.map((value) => {
      if (value === 0) return 0; // Preserve zero positions

      const calculatedValue = (value / 5) * amount; // Calculate the new value
      const roundedValue = Math.round(calculatedValue); // Round to nearest integer

      return roundedValue === 0 ? 1 : roundedValue; // Ensure minimum value is 1
    });
    console.log(resultArray);
    router.push({
      pathname: '/body/calculate',
      params: {
        calculatedValues: JSON.stringify(resultArray), // Pass the result array as a JSON string
        amount,
      },
    });
  };

  return (
    <View style={styles.pageContainer}>
      <View style={styles.header}>
        <Text style={styles.headerText}>How many exercises do you want to do?</Text>
      </View>
      {/*<Text style={styles.text}>Muscle Values: {muscleValues.join(', ')}</Text>*/}
      
      <TextInput
        style={styles.inputField}
        placeholder="Enter Amount"
        keyboardType="numeric"
        value={amount.toString()}
        onChangeText={text => setAmount(Number(text))}
      />
      
      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Submit</Text>
      </TouchableOpacity>
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
  header: {
    backgroundColor: '#7d2917',
    width: '100%',
    padding: 15,
    borderRadius: 5,
    marginBottom: 20,
  },
  headerText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  text: {
    fontSize: 18,
    marginBottom: 20,
    color: '#fff', // Changed text color to white for better contrast against grey background
  },
  inputField: {
    marginBottom: 20,
    padding: 10,
    fontSize: 16,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#ffffff',
    width: '100%',
    maxWidth: 300,
  },
  submitButton: {
    backgroundColor: '#7d2917', // Red background
    padding: 12,
    borderRadius: 5,
    width: '100%', // Ensure full width
    maxWidth: 300, // Limits button width for better aesthetics
    alignItems: 'center', // Center the text horizontally
  },
  buttonText: {
    color: '#fff', // White text color for contrast
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Amount;