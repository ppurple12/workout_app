/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#7d2917';
const tintColorDark = '#151718';

export const Colors = {
  light: {
    text: '#fff',
    background: '#7d2917',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#fff',
    background: '#151718',
    tint: tintColorDark,
    icon: '#7d2917',
    tabIconDefault: '#151718',
    tabIconSelected: '#151718',
  },
};
