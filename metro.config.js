const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('tflite');

// If building for web, alias native-only modules to local web stubs
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web') {
    if (moduleName === 'react-native-vision-camera') {
      return {
        type: 'sourceFile',
        filePath: path.resolve(__dirname, 'src/web-stubs/react-native-vision-camera.js'),
      };
    }
    if (moduleName === 'react-native-fast-tflite') {
      return {
        type: 'sourceFile',
        filePath: path.resolve(__dirname, 'src/web-stubs/react-native-fast-tflite.js'),
      };
    }
  }
  
  // Fallback to default resolver
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
