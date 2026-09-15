import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'

// `App.tsx` uses `@react-navigation` + `react-native-screens`, which has no RNW
// New Arch project. The harness suites drive HybridObjects over the bridge and
// don't touch the UI, so the Windows app just needs to host the JS runtime —
// hence this static placeholder.
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
