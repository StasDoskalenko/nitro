# Nitro on React Native Windows

> **Experimental.** This ships the reusable build glue for compiling Nitro on Windows.
> See [the Windows guide](https://nitro.margelo.com/docs/guides/windows) for the full story.

## Why this is different from iOS / Android

On iOS and Android, `react-native-nitro-modules` builds a shared framework/`.so` and
every Nitro module links against it, so `margelo::nitro::install()` and the
`HybridObjectRegistry` live in one place.

There is **no standalone `NitroModules.dll` on Windows yet**
([mrousavy/nitro#168](https://github.com/mrousavy/nitro/issues/168)). Instead, a Nitro
module **compiles Nitro's `cpp/` sources into its own React Native Windows module DLL**.
This folder provides the pieces that makes that a two-line change instead of a fork:

| File | Purpose |
| --- | --- |
| `NitroModules.props` | Include paths, C++20, forced-include, warning suppressions. Import after `Microsoft.Cpp.props`. |
| `NitroModules.targets` | Adds Nitro's `cpp/` sources + the Windows platform layer + the `NitroModules` TurboModule installer. Import after `Microsoft.Cpp.targets`. Also regenerates the `<NitroModules/*.hpp>` include shims before every compile. |
| `NitroMsvcStdCompat.h` | Standard headers MSVC's STL does not transitively include. |
| `src/NitroModulesModule.{h,cpp}` | `REACT_MODULE(NitroModules)` → `margelo::nitro::install()`. Compiled into your DLL. |
| `src/platform/*.cpp` | Windows implementations of `NitroLogger` and `ThreadUtils`. |
| `src/threading/UIThreadDispatcher.*` | Minimal UI-thread dispatcher (Hybrid Views are not supported on Windows yet). |
| `include/NitroModules/*.hpp` | Generated one-line shims so `#include <NitroModules/Foo.hpp>` resolves under MSVC. |

## Wiring it into a Nitro module's `.vcxproj`

```xml
<!-- Resolve the package (or set NitroModulesDir explicitly). -->
<PropertyGroup Label="ReactNativeWindowsProps">
  <NitroModulesDir Condition="'$(NitroModulesDir)' == ''">$([MSBuild]::GetDirectoryNameOfFileAbove($(SolutionDir), 'node_modules\react-native-nitro-modules\package.json'))\node_modules\react-native-nitro-modules\</NitroModulesDir>
</PropertyGroup>

<Import Project="$(VCTargetsPath)\Microsoft.Cpp.props" />
<Import Project="$(NitroModulesDir)windows\NitroModules.props" />
...
<!-- your generated spec + HybridObject .cpp files here -->
...
<Import Project="$(VCTargetsPath)\Microsoft.Cpp.targets" />
<Import Project="$(NitroModulesDir)windows\NitroModules.targets" />
```

Register your HybridObjects from your own `IReactPackageProvider` (or a `REACT_INIT`),
e.g.:

```cpp
margelo::nitro::HybridObjectRegistry::registerHybridObjectConstructor(
    "MyObject", []() { return std::make_shared<HybridMyObject>(); });
```

## Requirements

- React Native Windows **0.84+** (New Architecture)
- Visual Studio 2022 (MSVC v143) or 2026 (MSVC v145), "Desktop development with C++"
- Windows SDK 10.0.26100
- Node.js on `PATH` (the shim generator runs during the build)

## Limitations

- **One Nitro module per app.** Two modules would each compile their own copy of the
  registry. A standalone exported `NitroModules.dll` is the long-term fix (#168).
- No Hybrid **Views** (`cpp/views/` is not compiled).
- No Nitrogen Windows autolinking output yet — register HybridObjects by hand.
