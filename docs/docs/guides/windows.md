---
description: How to build and ship a Nitro module for React Native Windows.
---

# Windows

:::warning Experimental
Windows support is new and evolving. It currently targets **one Nitro module per app**
and does not support Hybrid Views. Track progress in
[nitro#168](https://github.com/mrousavy/nitro/issues/168).
:::

## How Nitro installs on Windows

On iOS and Android, `react-native-nitro-modules` builds one shared binary that every
Nitro module links against, so `margelo::nitro::install()` and the `HybridObjectRegistry`
live in a single place.

Windows has no standalone `NitroModules.dll` yet. Instead, **your Nitro module compiles
Nitro's `cpp/` sources directly into its own React Native Windows module DLL**, and that
same DLL implements the `NitroModules` TurboModule that the JS expects:

```
JS   TurboModuleRegistry.getEnforcing('NitroModules').install()
       │
       ▼
WinRT REACT_MODULE(NitroModules) in <your-module>.dll
       install()  →  margelo::nitro::install(runtime, CallInvokerDispatcher)
       │
       ▼
     global.NitroModulesProxy  →  your HybridObjects
```

`react-native-nitro-modules` ships the reusable build glue under
[`windows/`](https://github.com/mrousavy/nitro/tree/main/packages/react-native-nitro-modules/windows):
MSBuild `.props`/`.targets`, the `REACT_MODULE(NitroModules)` installer, the Windows
implementations of `NitroLogger`/`ThreadUtils`, and a generator for the
`<NitroModules/*.hpp>` include shims MSVC needs.

## Requirements

- [React Native Windows](https://microsoft.github.io/react-native-windows/) **0.84 or higher** (New Architecture)
- Visual Studio 2022 (MSVC v143) or 2026 (MSVC v145) with **Desktop development with C++** and the **Windows App SDK / WinUI** workload
- Windows SDK **10.0.26100**
- Node.js on `PATH` — the include-shim generator runs as an MSBuild step

Run [`rnw-dependencies.ps1`](https://microsoft.github.io/react-native-windows/docs/rnw-dependencies) from an elevated PowerShell prompt if anything is missing.

## Adding a Windows project to your Nitro module

Your module needs a React Native Windows C++ module project (`windows/<Name>/<Name>.vcxproj`
plus a `.sln`). Start from a `react-native-windows` "cpp-lib" template, then wire in Nitro:

```xml
<!-- Resolve the package. A consumer can also set NitroModulesDir explicitly. -->
<PropertyGroup Label="ReactNativeWindowsProps">
  <NitroModulesDir Condition="'$(NitroModulesDir)' == ''">$([MSBuild]::GetDirectoryNameOfFileAbove($(SolutionDir), 'node_modules\react-native-nitro-modules\package.json'))\node_modules\react-native-nitro-modules\</NitroModulesDir>
</PropertyGroup>

<Import Project="$(VCTargetsPath)\Microsoft.Cpp.props" />
<Import Project="$(NitroModulesDir)windows\NitroModules.props" />

<!-- ... your project configuration ... -->

<ItemGroup>
  <!-- Your Nitrogen output + HybridObject implementations -->
  <ClCompile Include="..\..\nitrogen\generated\shared\c++\HybridMyObjectSpec.cpp" />
  <ClCompile Include="..\..\cpp\HybridMyObject.cpp" />
</ItemGroup>

<Import Project="$(VCTargetsPath)\Microsoft.Cpp.targets" />
<Import Project="$(NitroModulesDir)windows\NitroModules.targets" />
```

`NitroModules.props` sets C++20, the include paths for `cpp/`, the forced-include for
MSVC standard-library gaps, and warning suppressions. `NitroModules.targets` adds Nitro's
`cpp/` sources, the Windows platform layer, and the `NitroModules` installer, and
regenerates `windows/include/NitroModules/*.hpp` before each compile.

### Registering your HybridObjects

The bundled installer only calls `margelo::nitro::install()`. Register your
HybridObjects from your module's own `IReactPackageProvider` (or a `REACT_INIT` method):

```cpp
#include <NitroModules/HybridObjectRegistry.hpp>

margelo::nitro::HybridObjectRegistry::registerHybridObjectConstructor(
    "MyObject", []() { return std::make_shared<HybridMyObject>(); });
```

### App setup

Autolink your module's `.vcxproj` from the app's `react-native.config.js` as usual.
`react-native-nitro-modules` itself declares `platforms.windows: null`, so there is
nothing extra to exclude.

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
| One Nitro module per app | Multiple modules would each compile their own `HybridObjectRegistry`. A standalone exported `NitroModules.dll` is the fix ([#168](https://github.com/mrousavy/nitro/issues/168)). |
| Hybrid Views | Not supported — `cpp/views/` is not compiled. |
| Nitrogen autolinking | No Windows output yet — register HybridObjects by hand. |
| Architectures | `x64` and `ARM64` (matches RNW New Arch). |
