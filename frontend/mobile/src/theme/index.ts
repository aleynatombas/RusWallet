import { MD3LightTheme, configureFonts } from 'react-native-paper';

/**
 * Web (shadcn primary indigo) ile uyumlu tema – primary: indigo
 */
const fontConfig = configureFonts({ config: {} });

export const appTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: 'rgb(79, 70, 229)',   // indigo-600 ~ web primary
    primaryContainer: 'rgb(224, 231, 255)',
    onPrimary: 'rgb(255, 255, 255)',
    onPrimaryContainer: 'rgb(30, 27, 75)',
    surface: 'rgb(249, 250, 251)', // gray-50
    surfaceVariant: 'rgb(243, 244, 246)',
    outline: 'rgb(209, 213, 219)',
  },
  fonts: fontConfig,
};

export type AppTheme = typeof appTheme;
