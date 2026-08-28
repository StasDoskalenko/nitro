import { describe, expect, it } from 'react-native-harness'
import { NitroModules } from 'react-native-nitro-modules'

// Proves the Windows harness runner launches the app, the bridge connects and
// assertions round-trip. Deploy the app first (`react-native run-windows --arch
// x64 --no-launch`), then: `yarn test:harness --harnessRunner windows windows-smoke`
describe('windows harness smoke', () => {
  it('runs assertions over the bridge', () => {
    expect(1 + 1).toBe(2)
  })

  it('has the NitroModules JS entry point', () => {
    expect(typeof NitroModules.createHybridObject).toBe('function')
  })
})
