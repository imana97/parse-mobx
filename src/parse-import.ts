// Dynamic import helper for Parse SDK
// This handles conditional import for React Native, Expo, and regular environments

declare const __DEV__: boolean | undefined;
declare const global: any;

let Parse: any;

// Multiple detection methods for React Native/Expo environments
const isReactNative = () => {
  // Check for React Native global
  if (typeof global !== 'undefined' && (global as any).ReactNative) {
    return true;
  }

  // Check for Expo
  if (typeof global !== 'undefined' && (global as any).EXPO_PUBLIC_PLATFORM) {
    return true;
  }

  // Check for navigator (traditional React Native detection)
  if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
    return true;
  }

  // Check for React Native specific globals
  if (typeof __DEV__ !== 'undefined') {
    try {
      require('react-native');
      return true;
    } catch (e) {
      // Not in React Native
    }
  }

  return false;
};

const loadParse = () => {
  if (isReactNative()) {
    try {
      // Try parse/react-native first (works in Expo and bare React Native)
      Parse = require('parse/react-native');
    } catch (e) {
      try {
        // Fallback to regular parse
        Parse = require('parse');
      } catch (fallbackError) {
        throw new Error('Parse SDK not found. Please install parse package: npm install parse');
      }
    }
  } else {
    try {
      Parse = require('parse');
    } catch (e) {
      throw new Error('Parse SDK not found. Please install parse package: npm install parse');
    }
  }
};

// Load Parse SDK
loadParse();

export default Parse;
