import { Tabs } from 'expo-router';
import React from 'react';

import { TabBarIcon } from '@/components/navigation/TabBarIcon';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        // Use consistent colors for active/inactive tint and background
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tabIconSelected, // Active tab color
        tabBarInactiveTintColor: Colors[colorScheme ?? 'light'].tabIconDefault, // Inactive tab color
        tabBarStyle: {
          backgroundColor: Colors[colorScheme ?? 'light'].background, // Tab bar background
        },
        headerShown: false, // Hide header if necessary
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'home' : 'home-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'code-slash' : 'code-slash-outline'} color={color} />
          ),
        }}
      />
      
    </Tabs>
  );
}