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
      // There is no standalone NitroModules project on Windows yet
      // (https://github.com/mrousavy/nitro/issues/168). A Nitro module compiles Nitro's
      // `cpp/` into its own RNW module DLL via `windows/NitroModules.{props,targets}`, so
      // there is nothing for react-native-windows to autolink here. `null` stops the RNW
      // autolink check from erroring on a native dependency with no Windows project.
      windows: null,
    },
  },
}
