# Nitro on React Native Windows

> **Experimental.** See the [Windows guide](https://nitro.margelo.com/docs/guides/windows) for the full story.

## Model

On Windows, `react-native-nitro-modules` builds a shared **`NitroModules.dll`** (this
folder's `NitroModules/NitroModules.vcxproj`). React Native Windows autolinks it into the
app (via `../react-native.config.js`), and it:

- compiles the shared Nitro core from `../cpp`,
- implements the `NitroModules` TurboModule (`REACT_MODULE(NitroModules)` →
  `margelo::nitro::install()`),
- owns the process-wide `HybridObjectRegistry` and per-`jsi::Runtime` caches.

Consuming Nitro modules **link `NitroModules.lib`** and compile only their own generated
specs + HybridObject implementations. This mirrors the shared `libNitroModules.so` /
framework used on Android / iOS, so **multiple Nitro modules per app work**.

The public core classes are tagged with `NITRO_EXPORT` (`cpp/utils/NitroDefines.hpp`) —
`__declspec(dllexport)` when building the DLL, `__declspec(dllimport)` when consuming it,
and a no-op on every other platform.

## Files

| File | Purpose |
| --- | --- |
| `NitroModules/NitroModules.vcxproj`, `NitroModules.sln` | The shared `NitroModules.dll`. |
| `NitroModules/NitroModulesModule.{h,cpp}` | `REACT_MODULE(NitroModules)` installer. |
| `NitroModules/ReactPackageProvider.*` | RNW package provider (`AddAttributedModules`). |
| `NitroModules/platform/*.cpp`, `NitroModules/threading/UIThreadDispatcher.*` | Windows implementations of `NitroLogger` / `ThreadUtils`. |
| `NitroModules/NitroMsvcStdCompat.h` | Standard headers MSVC's STL does not transitively include. |
| `ConsumeNitroModules.props` / `.targets` | Imported by a consuming Nitro module's `.vcxproj`. |
| `include/NitroModules/*.hpp` | Generated one-line shims so `#include <NitroModules/Foo.hpp>` resolves under MSVC. |

## Consuming from a Nitro module's `.vcxproj`

```xml
<PropertyGroup Label="ReactNativeWindowsProps">
  <NitroModulesDir Condition="'$(NitroModulesDir)' == ''">$([MSBuild]::GetDirectoryNameOfFileAbove($(SolutionDir), 'node_modules\react-native-nitro-modules\package.json'))\node_modules\react-native-nitro-modules\</NitroModulesDir>
</PropertyGroup>

<Import Project="$(VCTargetsPath)\Microsoft.Cpp.props" />
<Import Project="$(NitroModulesDir)windows\ConsumeNitroModules.props" />

<ItemGroup>
  <!-- your generated specs + HybridObject implementations -->
  <ClCompile Include="..\..\nitrogen\generated\shared\c++\HybridMyObjectSpec.cpp" />
  <ClCompile Include="..\..\cpp\HybridMyObject.cpp" />
</ItemGroup>

<Import Project="$(VCTargetsPath)\Microsoft.Cpp.targets" />
<Import Project="$(NitroModulesDir)windows\ConsumeNitroModules.targets" />
```

Register your HybridObjects from your own `IReactPackageProvider` / `REACT_INIT`:

```cpp
#include <NitroModules/HybridObjectRegistry.hpp>

margelo::nitro::HybridObjectRegistry::registerHybridObjectConstructor(
    "MyObject", []() { return std::make_shared<HybridMyObject>(); });
```

## Requirements

- React Native Windows **0.84+** (New Architecture)
- Visual Studio 2022 (MSVC v143) or 2026 (MSVC v145)
- Windows SDK 10.0.26100
- Node.js on `PATH` (the shim generator runs during the build)
- Every native module in the app built with the **same** MSVC toolset (the `NITRO_EXPORT`
  ABI is not stable across toolsets — RNW already enforces one toolset per app).

## Limitations

- No Hybrid **Views** (`cpp/views/` is not compiled).
- No Nitrogen Windows autolinking output yet — register HybridObjects by hand and import
  `ConsumeNitroModules.{props,targets}` manually.
