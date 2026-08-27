#pragma once

#include <winrt/Microsoft.ReactNative.h>

#include <NativeModules.h>

#include <optional>
#include <string>

namespace winrt::NitroModules
{

// Implements the `NitroModules` TurboModule that `react-native-nitro-modules` JS expects on
// every platform (`TurboModuleRegistry.getEnforcing('NitroModules').install()`).
//
// On iOS/Android this module ships in its own binary. On Windows there is no standalone
// `NitroModules.dll` yet (https://github.com/mrousavy/nitro/issues/168), so this source file
// is compiled *into the consuming Nitro module's* DLL via `windows/NitroModules.targets`.
// `install()` only wires up Nitro's JSI entry point - registering HybridObjects stays the
// responsibility of the consuming module (do it from your own `IReactPackageProvider`).
REACT_MODULE(NitroModules, L"NitroModules")
struct NitroModules
{
  REACT_INIT(Initialize)
  void Initialize(winrt::Microsoft::ReactNative::ReactContext const &reactContext) noexcept;

  REACT_SYNC_METHOD(install)
  std::optional<std::string> install() noexcept;

private:
  winrt::Microsoft::ReactNative::ReactContext m_context{nullptr};
};

} // namespace winrt::NitroModules
