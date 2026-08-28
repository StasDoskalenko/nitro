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
      // No standalone Windows module project (only a compile-check). Consumers that
      // need the Nitro type-system C++ compile it via the generated autolinking props.
      windows: null,
    },
  },
}
