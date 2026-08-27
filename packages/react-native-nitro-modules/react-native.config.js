// https://github.com/react-native-community/cli/blob/main/docs/dependencies.md

module.exports = {
  dependency: {
    platforms: {
      /**
       * @type {import('@react-native-community/cli-types').IOSDependencyParams}
       */
      ios: {},
      /**
       * @type {import('@react-native-community/cli-types').AndroidDependencyParams}
       */
      android: {},
      /**
       * @type {import('@react-native-windows/cli').WindowsDependencyConfig}
       *
       * `NitroModules.dll` is the shared Nitro core on Windows: react-native-windows
       * autolinks it into the app, and consuming Nitro modules link `NitroModules.lib`
       * (see `windows/ConsumeNitroModules.{props,targets}`). Mirrors the shared
       * `libNitroModules.so` / framework on Android / iOS.
       */
      windows: {
        sourceDir: 'windows',
        solutionFile: 'NitroModules.sln',
        projects: [
          {
            projectFile: 'NitroModules\\NitroModules.vcxproj',
            directDependency: true,
          },
        ],
      },
    },
  },
}
