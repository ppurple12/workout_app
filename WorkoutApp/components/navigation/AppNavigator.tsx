import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import Amount from '../../app/body/amount';
import Model from '../../app/body/Model';
import { RootStackParamList } from '../../types/navigation'; // Import the type

const Stack = createStackNavigator<RootStackParamList>(); // Use the type here

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Model">
        <Stack.Screen name="Amount" component={Amount} />
        <Stack.Screen name="Model" component={Model} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
