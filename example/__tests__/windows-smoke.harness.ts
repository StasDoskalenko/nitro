import { describe, expect, it } from 'react-native-harness'
import { NitroModules } from 'react-native-nitro-modules'

// Minimal smoke test for the Windows harness runner + bridge. It doesn't touch
// any HybridObject - it only proves the runner launches the app, the bridge
// connects, and assertions round-trip. Run it with:
//   yarn test:harness --platform windows --app <path-to-built-msix>
// (the app must be deployed first: `react-native run-windows --arch x64 --no-launch`)
describe('windows harness smoke', () => {
  it('runs assertions over the bridge', () => {
    expect(1 + 1).toBe(2)
  })

  it('has the NitroModules JS entry point', () => {
    expect(typeof NitroModules.createHybridObject).toBe('function')
  })
})
