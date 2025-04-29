// components/NavigationButton.tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

type HrefType = string;  // Use string or adjust as per your type

interface NavigationButtonProps {
  href: HrefType;
  title: string;
}

export const NavigationButton: React.FC<NavigationButtonProps> = ({ href, title }) => {
  const router = useRouter();

  const handlePress = () => {
    // Cast href to Href type if needed
    router.push(href as any);  // Use 'any' to bypass TypeScript if needed
  };

  return (
    <TouchableOpacity onPress={handlePress} style={styles.button}>
      <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 10,
    backgroundColor: '#151718',
    borderRadius: 5,
    marginTop: 10,
  },
  buttonText: {
    color: '#151718',
    textAlign: 'center',
    fontSize: 16,
  },
});