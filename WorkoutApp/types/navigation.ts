import { NavigationProp } from '@react-navigation/native';

export type RootStackParamList = {
  Layout: undefined;
  Home: undefined;
  Profile: undefined;
  NotFound: undefined;
  Model: undefined; // No parameters for Model
  Amount: { muscleValues: number[] }; // Amount screen expects muscleValues
  // Add other screens as needed
};

export type TabParamList = {
  Home: undefined;
  Profile: undefined;
};

// Extend the navigation prop for use in components
export type NavigationProps = NavigationProp<RootStackParamList>;