// React Native Harness platform runner for React Native Windows.
//
// react-native-harness ships `platform-android` / `platform-apple` only. The
// runner contract is open (`@react-native-harness/platforms` already types Web
// and Vega launch options), and the in-app runtime + bridge are platform
// agnostic: the runtime derives the bridge WebSocket URL from
// `getDevServer().url` (the Metro host:port the bundle loaded from) + `/__harness`.
// A React Native Windows Debug app defaults to `localhost:8081`, which is also
// the harness Metro default (`DEFAULT_METRO_PORT`), so no native dev-server
// override is needed as long as `metroPort` is left at 8081.
//
// This runner therefore only has to: launch the (already deployed) MSIX app,
// and hand back an `AppSession` that tracks its process.

import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import {
  createAppSessionEmitter,
  createBoundedLogBuffer,
} from '@react-native-harness/platforms'

const execFileAsync = promisify(execFile)

const POLL_INTERVAL_MS = 1000

/** Run a PowerShell snippet and return trimmed stdout. */
async function ps(script) {
  const { stdout } = await execFileAsync(
    'powershell',
    ['-NoProfile', '-NonInteractive', '-Command', script],
    { windowsHide: true }
  )
  return stdout.trim()
}

/**
 * Resolve the app's package family name + AUMID.
 * `config.packageName` is the identity Name from Package.appxmanifest
 * (e.g. `ReactNativeNitroExample`). If a build path is provided via
 * HARNESS_APP_PATH we still launch by identity - the app must already be
 * deployed (CI does `react-native run-windows --no-launch` first).
 */
async function resolveApp(config) {
  const name = config.packageName
  if (!name) {
    throw new Error(
      'windows-runner: `packageName` (Package.appxmanifest Identity Name) is required'
    )
  }
  const pfn = await ps(
    `(Get-AppxPackage -Name '${name}' | Select-Object -First 1).PackageFamilyName`
  )
  if (!pfn) {
    throw new Error(
      `windows-runner: app '${name}' is not deployed. Run \`react-native run-windows --arch x64 --no-launch\` first.`
    )
  }
  const aumid = `${pfn}!App`
  return { name, pfn, aumid }
}

async function isProcessRunning(processName) {
  const out = await ps(
    `(Get-Process -Name '${processName}' -ErrorAction SilentlyContinue | Measure-Object).Count`
  ).catch(() => '0')
  return Number(out) > 0
}

async function launchApp(aumid) {
  // Shell-activate the MSIX app. `explorer.exe shell:AppsFolder\<aumid>` is the
  // reliable activation path, but explorer.exe almost always exits non-zero even
  // on success, so ignore its exit code - the caller confirms the app came up by
  // polling for its process.
  await execFileAsync('explorer.exe', [`shell:AppsFolder\\${aumid}`], {
    windowsHide: true,
  }).catch(() => {})
}

async function stopApp(processName) {
  await ps(
    `Get-Process -Name '${processName}' -ErrorAction SilentlyContinue | Stop-Process -Force`
  ).catch(() => {})
}

/** @type {import('@react-native-harness/platforms').HarnessPlatformRunnerFactory} */
const getWindowsRunner = async (config, _harnessConfig, init) => {
  const app = await resolveApp(config)
  const processName = config.processName ?? config.packageName

  const createAppSession = async () => {
    const emitter = createAppSessionEmitter()
    const logBuffer = createBoundedLogBuffer()
    let state = { status: 'running' }
    let stopPolling = false

    await stopApp(processName) // clean slate
    await launchApp(app.aumid)

    // Give shell activation a moment, then confirm the process came up.
    for (let i = 0; i < 15 && !(await isProcessRunning(processName)); i++) {
      await new Promise((r) => setTimeout(r, 400))
    }
    if (!(await isProcessRunning(processName))) {
      throw new Error(
        `windows-runner: '${processName}' did not start after launching ${app.aumid}`
      )
    }

    const pollTask = (async () => {
      let sawRunning = true
      while (!stopPolling) {
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS))
        if (stopPolling) break
        const running = await isProcessRunning(processName).catch(() => sawRunning)
        if (!running && sawRunning && state.status === 'running') {
          state = { status: 'exited', occurredAt: Date.now(), reason: 'process-gone' }
          emitter.emit({ type: 'app_exited' })
          return
        }
        sawRunning = running
      }
    })()

    const dispose = async () => {
      if (state.status === 'disposed') return
      stopPolling = true
      state = { status: 'disposed', occurredAt: Date.now() }
      emitter.clear()
      await stopApp(processName)
      await pollTask
    }

    if (init.signal?.aborted) void dispose()
    else init.signal?.addEventListener('abort', () => void dispose(), { once: true })

    return {
      dispose,
      getState: async () => state,
      getLogs: () => logBuffer.getLogs(),
      addListener: emitter.addListener,
      removeListener: emitter.removeListener,
    }
  }

  return {
    createAppSession,
    dispose: async () => {
      await stopApp(processName)
    },
  }
}

export default getWindowsRunner
