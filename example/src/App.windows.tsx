import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'

/**
 * Windows entry point for the Nitro example app.
 *
 * The cross-platform `App.tsx` is built around `@react-navigation` +
 * `react-native-screens`, which has no React-Native-Windows New Architecture
 * project yet. The Windows build only needs to host the JS runtime so the
 * react-native-harness bridge can attach and run the `*.harness.ts` suites
 * (they exercise HybridObjects directly and don't touch the UI), so this
 * screen is deliberately just a static placeholder.
 */
export default function App(): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nitro Example</Text>
      <Text style={styles.subtitle}>
        Windows harness host — run the suites with{'\n'}
        `yarn test:harness --platform windows`
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: { fontSize: 24, fontWeight: '600', marginBottom: 8 },
  subtitle: { fontSize: 14, textAlign: 'center', opacity: 0.7 },
})
