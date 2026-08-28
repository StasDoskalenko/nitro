const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config')

const fs = require('fs')
const path = require('node:path')
const pak = require('../package.json')

const root = path.resolve(__dirname, '..')
const modules = Object.keys({ ...pak.peerDependencies })

// On Windows, require.resolve through workspace junctions can return a path with
// a different drive-letter case than process.cwd(). Metro's file lookup is
// case-sensitive, so normalize to match cwd.
function normalizePathDrive(p) {
  if (process.platform === 'win32' && p.length >= 2 && p[1] === ':') {
    return process.cwd()[0] + p.slice(1)
  }
  return p
}

const rnwPath = normalizePathDrive(
  fs.realpathSync(
    path.resolve(require.resolve('react-native-windows/package.json'), '..')
  )
)

// `react-native run-windows` / `react-native start` install this redirect
// automatically (via @react-native/community-cli-plugin, from the `windows`
// platform's `npmPackageName`), but react-native-harness loads this config with
// a bare `Metro.loadConfig` and never goes through the CLI. Without it, a
// `--platform windows` bundle fails to resolve the RNW-only modules
// (`react-native/src/private/.../ReactDevToolsSettingsManager`, etc.). Mirrors
// @react-native/community-cli-plugin's `reactNativePlatformResolver`.
function windowsPlatformResolver(context, moduleName, platform) {
  if (platform === 'windows') {
    if (moduleName === 'react-native') {
      moduleName = 'react-native-windows'
    } else if (moduleName.startsWith('react-native/')) {
      moduleName = `react-native-windows/${moduleName.slice('react-native/'.length)}`
    }
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
    resolveRequest: windowsPlatformResolver,
    // Only one version of each peerDependency: block them at the root, alias to
    // the versions in example/node_modules.
    extraNodeModules: modules.reduce((acc, name) => {
      acc[name] = path.join(__dirname, 'node_modules', name)
      return acc
    }, {}),
    blockList: [
      // Stops `run-windows` from crashing a running Metro server.
      new RegExp(
        `${path.resolve(__dirname, 'windows').replace(/[/\\]/g, '/')}.*`
      ),
      // Avoids EBUSY on msbuild.ProjectImports.zip and other build artifacts.
      new RegExp(`${rnwPath}/build/.*`),
      new RegExp(`${rnwPath}/target/.*`),
      /.*\.ProjectImports\.zip/,
    ],
  },

  serializer: {
    // `@react-native/community-cli-plugin` injects the out-of-tree platform's
    // InitializeCore here when you go through `react-native start`; the harness
    // loads this config with a bare `Metro.loadConfig` and doesn't. Without
    // react-native-windows' InitializeCore the Windows bundle never runs
    // `setUpBatchedBridge`, so `HMRClient` isn't a registered callable module
    // and RNW's native `HMRClient.setup()` call redboxes the instance before
    // the harness runtime can attach.
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
