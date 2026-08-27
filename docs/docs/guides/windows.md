---
description: How to build and ship a Nitro module for React Native Windows.
---

# Windows

:::warning Experimental
Windows support is new and evolving. It does not support Hybrid Views yet, and there is no
Nitrogen Windows codegen — the per-module build wiring is manual. Track progress in
[nitro#168](https://github.com/mrousavy/nitro/issues/168).
:::

## How Nitro installs on Windows

`react-native-nitro-modules` builds a shared **`NitroModules.dll`** on Windows, just like it
builds `libNitroModules.so` on Android and a framework on iOS. React Native Windows
autolinks it into the app, where it:

- compiles the shared Nitro core (`cpp/`),
- implements the `NitroModules` TurboModule the JS calls
  (`TurboModuleRegistry.getEnforcing('NitroModules').install()`),
- owns the process-wide `HybridObjectRegistry` and the per-`jsi::Runtime` caches.

```
JS    TurboModuleRegistry.getEnforcing('NitroModules').install()
        │
        ▼
      REACT_MODULE(NitroModules) in NitroModules.dll
        install()  →  margelo::nitro::install(runtime, CallInvokerDispatcher)
        │
        ▼
      global.NitroModulesProxy   ◄── HybridObjectRegistry (shared)
        ▲
        │  registerHybridObjectConstructor("MyObject", …)
      your module DLL  (links NitroModules.lib, compiles only its own specs)
```

Because every module links the **same** `NitroModules.dll`, **multiple Nitro modules per
app work**.

The public core classes are tagged with `NITRO_EXPORT` (in `cpp/utils/NitroDefines.hpp`):
`__declspec(dllexport)` when building `NitroModules.dll`, `__declspec(dllimport)` when a
module consumes it, and a no-op on iOS / Android / any other target.

## Requirements

- [React Native Windows](https://microsoft.github.io/react-native-windows/) **0.84 or higher** (New Architecture)
- Visual Studio 2022 (MSVC v143) or 2026 (MSVC v145) with **Desktop development with C++** and the **Windows App SDK / WinUI** workload
- Windows SDK **10.0.26100**
- Node.js on `PATH` — the include-shim generator runs as an MSBuild step
- Every native module in the app built with the **same** MSVC toolset (the `NITRO_EXPORT` ABI is not stable across toolsets; RNW already enforces one toolset per app)

Run [`rnw-dependencies.ps1`](https://microsoft.github.io/react-native-windows/docs/rnw-dependencies) from an elevated PowerShell prompt if anything is missing.

## Adding a Windows project to your Nitro module

Your module needs a React Native Windows C++ module project (`windows/<Name>/<Name>.vcxproj`
plus a `.sln`). Start from a `react-native-windows` "cpp-lib" template, then wire in Nitro:

```xml
<PropertyGroup Label="ReactNativeWindowsProps">
  <NitroModulesDir Condition="'$(NitroModulesDir)' == ''">$([MSBuild]::GetDirectoryNameOfFileAbove($(SolutionDir), 'node_modules\react-native-nitro-modules\package.json'))\node_modules\react-native-nitro-modules\</NitroModulesDir>
</PropertyGroup>

<Import Project="$(VCTargetsPath)\Microsoft.Cpp.props" />
<Import Project="$(NitroModulesDir)windows\ConsumeNitroModules.props" />

<ItemGroup>
  <!-- Your Nitrogen output + HybridObject implementations -->
  <ClCompile Include="..\..\nitrogen\generated\shared\c++\HybridMyObjectSpec.cpp" />
  <ClCompile Include="..\..\cpp\HybridMyObject.cpp" />
</ItemGroup>

<Import Project="$(VCTargetsPath)\Microsoft.Cpp.targets" />
<Import Project="$(NitroModulesDir)windows\ConsumeNitroModules.targets" />
```

- `ConsumeNitroModules.props` sets `NITRO_USING_SHARED_LIBRARY`, C++20, the `cpp/` include
  paths, and the MSVC standard-library compat forced-include.
- `ConsumeNitroModules.targets` adds a `ProjectReference` to `NitroModules.vcxproj` (so it
  builds first and `NitroModules.lib` is linked) and regenerates the
  `<NitroModules/*.hpp>` shims before each compile.

Do **not** add Nitro's `cpp/*.cpp` to your project — they live in `NitroModules.dll`.

### Registering your HybridObjects

`NitroModules.dll` only calls `margelo::nitro::install()`. Register your HybridObjects from
your module's own `IReactPackageProvider` (or a `REACT_INIT` method):

```cpp
#include <NitroModules/HybridObjectRegistry.hpp>

margelo::nitro::HybridObjectRegistry::registerHybridObjectConstructor(
    "MyObject", []() { return std::make_shared<HybridMyObject>(); });
```

### App setup

Autolink your module's `.vcxproj` from the app's `react-native.config.js` as usual.
`react-native-nitro-modules` autolinks `NitroModules.dll` on its own.

```js
// <your-module>/react-native.config.js
module.exports = {
  dependency: {
    platforms: {
      windows: {
        sourceDir: 'windows',
        solutionFile: 'MyModule.sln',
        projects: [{ projectFile: 'MyModule\\MyModule.vcxproj', directDependency: true }],
      },
    },
  },
}
```

Then:

```bash
yarn react-native run-windows
```

## Worked example

[NitromelonDB](https://github.com/StasDoskalenko/NitromelonDB) is a SQLite Nitro module
with a full Windows implementation and a `windows-2025` CI job that builds its example
app in Release and runs UI flows against it.

## Limitations

| | Status |
| --- | --- |
| Hybrid Views | Not supported — `cpp/views/` is not compiled. |
| Nitrogen autolinking | No Windows output yet — import `ConsumeNitroModules.*` and register HybridObjects by hand. |
| Toolset | All native modules in the app must use the same MSVC toolset. |
| Architectures | `x64` and `ARM64`. |
