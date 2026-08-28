const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config')
const path = require('path')
const pak = require('../package.json')

const root = path.resolve(__dirname, '..')
const modules = Object.keys({ ...pak.peerDependencies })

// `react-native start` installs this redirect via
// @react-native/community-cli-plugin (from the `windows` platform's
// `npmPackageName`). react-native-harness loads the config with a bare
// `Metro.loadConfig` and skips it, so a `--platform windows` bundle otherwise
// can't resolve the RNW-only `react-native/...` modules.
function resolveRequest(context, moduleName, platform) {
  if (
    platform === 'windows' &&
    (moduleName === 'react-native' || moduleName.startsWith('react-native/'))
  ) {
    moduleName = moduleName.replace('react-native', 'react-native-windows')
  }
  return context.resolveRequest(context, moduleName, platform)
}

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  watchFolders: [root],

  resolver: {
    platforms: ['ios', 'android', 'native', 'windows'],
    resolveRequest,
    // One version of each peerDependency: block them at the root, alias to the
    // versions in example/node_modules.
    extraNodeModules: modules.reduce((acc, name) => {
      acc[name] = path.join(__dirname, 'node_modules', name)
      return acc
    }, {}),
    // Keeps `react-native run-windows` from crashing a running Metro server.
    blockList: [
      new RegExp(
        `${path.resolve(__dirname, 'windows').replace(/[/\\]/g, '/')}.*`
      ),
      /.*\.ProjectImports\.zip/,
    ],
  },

  // Same CLI-plugin gap as `resolveRequest`: without RNW's InitializeCore the
  // Windows bundle never runs `setUpBatchedBridge`, so `HMRClient` isn't a
  // registered callable module and RNW's native `HMRClient.setup()` redboxes
  // the instance before the harness can attach.
  serializer: {
    getModulesRunBeforeMainModule: () => [
      require.resolve('react-native/Libraries/Core/InitializeCore'),
      require.resolve('react-native-windows/Libraries/Core/InitializeCore'),
    ],
  },

  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
}

module.exports = mergeConfig(getDefaultConfig(__dirname), config)
