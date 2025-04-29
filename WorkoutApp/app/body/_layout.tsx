import { Stack } from 'expo-router';
import React from 'react';

import { TabBarIcon } from '@/components/navigation/TabBarIcon';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { NavigationContainer } from '@react-navigation/native';


export default function BodyLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // Show the header for screens in this stack
      }}
    >
      
        <Stack.Screen name="amount"  initialParams={{ numbers: [] }} />
        <Stack.Screen name="calculate" initialParams={{ numbers: [] }} />
        <Stack.Screen name="Model"  />
      </Stack>
  );
}
