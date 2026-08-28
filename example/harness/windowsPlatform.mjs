// `windowsPlatform({...})` -> a react-native-harness `HarnessPlatform`, wired the
// same way `androidPlatform()` / `applePlatform()` are in rn-harness.config.mjs.
// See ./windows-runner.mjs for how it drives the app.

/**
 * @param {{
 *   name: string,
 *   // Package.appxmanifest Identity Name, e.g. 'ReactNativeNitroExample'
 *   packageName: string,
 *   // RNW app process name (defaults to packageName)
 *   processName?: string,
 * }} config
 */
export function windowsPlatform(config) {
  return {
    name: config.name,
    config,
    // A file:// URL string - import.meta.resolve() can hand back a bare
    // `d:\...` path on Windows, which the harness's dynamic import() rejects.
    runner: new URL('./windows-runner.mjs', import.meta.url).href,
    platformId: 'windows',
    getResourceLockKey: () => `windows:${config.packageName}`,
  }
}
