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

## Opting in

Declare `windows: 'c++'` on the HybridObject spec (Windows only has a C++ implementation):

```ts
interface MyObject extends HybridObject<{ ios: 'c++'; android: 'c++'; windows: 'c++' }> {
  // ...
}
```

With that, `nitrogen` generates (into `nitrogen/generated/windows/`):

| File | |
| --- | --- |
| `<Name>+autolinking.props` / `.targets` | import these from your `.vcxproj` — they pull in `ConsumeNitroModules.{props,targets}`, add every generated shared C++ spec + the autolinking entry point as `<ClCompile>`, and set the include dirs. |
| `<Name>Autolinking.hpp` / `.cpp` | `registerHybridObjects()` — call it from your package provider. |

`<Name>` comes from `nitro.json` `windows.windowsProjectName` (default: `android.androidCxxLibName`).

## Adding a Windows project to your Nitro module

Your module needs a React Native Windows C++ module project (`windows/<Name>/<Name>.vcxproj`
plus a `.sln`). Start from a `react-native-windows` "cpp-lib" template, then import the two
generated files:

```xml
<PropertyGroup Label="ReactNativeWindowsProps">
  <NitroModulesDir Condition="'$(NitroModulesDir)' == ''">$([MSBuild]::GetDirectoryNameOfFileAbove($(SolutionDir), 'node_modules\react-native-nitro-modules\package.json'))\node_modules\react-native-nitro-modules\</NitroModulesDir>
</PropertyGroup>

<Import Project="$(VCTargetsPath)\Microsoft.Cpp.props" />
<Import Project="..\..\nitrogen\generated\windows\MyModule+autolinking.props" />

<ItemGroup>
  <!-- Only your own HybridObject implementations - the generated specs come from the .props -->
  <ClCompile Include="..\..\cpp\HybridMyObject.cpp" />
</ItemGroup>
<ItemDefinitionGroup>
  <ClCompile>
    <!-- so the generated registration can #include "HybridMyObject.hpp" -->
    <AdditionalIncludeDirectories>..\..\cpp;%(AdditionalIncludeDirectories)</AdditionalIncludeDirectories>
  </ClCompile>
</ItemDefinitionGroup>

<Import Project="$(VCTargetsPath)\Microsoft.Cpp.targets" />
<Import Project="..\..\nitrogen\generated\windows\MyModule+autolinking.targets" />
```

`ConsumeNitroModules.props` (imported transitively) sets `NITRO_USING_SHARED_LIBRARY`, C++20,
the `cpp/` include paths, and the MSVC standard-library compat forced-include.
`ConsumeNitroModules.targets` adds a `ProjectReference` to `NitroModules.vcxproj` (so it
builds first and `NitroModules.lib` is linked) and regenerates the `<NitroModules/*.hpp>`
shims before each compile.

Do **not** add Nitro's `cpp/*.cpp` to your project — they live in `NitroModules.dll`.

### Registering your HybridObjects

Call the generated `registerHybridObjects()` from your module's own `IReactPackageProvider`:

```cpp
#include "MyModuleAutolinking.hpp"  // <-- from nitrogen/generated/windows

void ReactPackageProvider::CreatePackage(IReactPackageBuilder const &packageBuilder) noexcept {
  margelo::nitro::mymodule::registerHybridObjects();
  AddAttributedModules(packageBuilder, true);
}
```

<details>
<summary>Manual registration (without the generated file)</summary>

```cpp
#include <NitroModules/HybridObjectRegistry.hpp>

margelo::nitro::HybridObjectRegistry::registerHybridObjectConstructor(
    "MyObject", []() { return std::make_shared<HybridMyObject>(); });
```
</details>

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
| Bridged languages | Windows is C++ only — no Swift/Kotlin equivalent. |
| Toolset | All native modules in the app must use the same MSVC toolset. |
| Architectures | `x64` and `ARM64`. |
