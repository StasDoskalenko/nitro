const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config')
const path = require('path')
const pak = require('../package.json')

const root = path.resolve(__dirname, '..')
const modules = Object.keys({ ...pak.peerDependencies })

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  watchFolders: [root],

  resolver: {
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
