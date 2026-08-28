module.exports = {
  dependencies: {
    // These UI libraries have no React-Native-Windows New Architecture project
    // (react-native-screens ships a UWP/old-arch vcxproj; segmented-control and
    // safe-area-context ship none). The Windows example uses src/App.windows.tsx,
    // which renders the Nitro test screen directly without react-navigation, so
    // none of them are in the Windows JS bundle either. Autolinking them anyway
    // would pull broken projects into the solution.
    'react-native-screens': { platforms: { windows: null } },
    'react-native-safe-area-context': { platforms: { windows: null } },
    '@react-native-segmented-control/segmented-control': {
      platforms: { windows: null },
    },
  },
}
