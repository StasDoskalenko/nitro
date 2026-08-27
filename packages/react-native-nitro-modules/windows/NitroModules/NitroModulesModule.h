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
// This is compiled into the shared `NitroModules.dll` (see `NitroModules.vcxproj`), which
// React Native Windows autolinks into the app. `install()` only wires up Nitro's JSI entry
// point - registering HybridObjects stays the responsibility of each consuming Nitro module
// (do it from your own `IReactPackageProvider`).
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
