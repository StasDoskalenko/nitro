// const path = require('path');
// const pak = require('../package.json');

module.exports = {
  dependencies: {
    // [pak.name]: {
    //   root: path.join(__dirname, '..'),
    // },

    // No React-Native-Windows New Arch project, and unused by the Windows
    // example (see src/App.windows.tsx) — keep them out of Windows autolink.
    'react-native-screens': { platforms: { windows: null } },
    'react-native-safe-area-context': { platforms: { windows: null } },
    '@react-native-segmented-control/segmented-control': {
      platforms: { windows: null },
    },
  },
}
