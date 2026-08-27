#include "pch.h"

#include "NitroModulesModule.h"

#include <windows.h>

#include <CallInvokerDispatcher.hpp>
#include <InstallNitro.hpp>

#include <JSI/JsiApiContext.h>

#include <exception>
#include <memory>
#include <string>

using namespace winrt::Microsoft::ReactNative;

namespace winrt::NitroModules
{

void NitroModules::Initialize(ReactContext const &reactContext) noexcept
{
  m_context = reactContext;
}

std::optional<std::string> NitroModules::install() noexcept
{
  try {
    facebook::jsi::Runtime *runtime = TryGetOrCreateContextRuntime(m_context);
    if (runtime == nullptr) {
      return std::string("NitroModules.install(): could not resolve the JSI runtime from the ReactContext.");
    }

    auto callInvoker = m_context.CallInvoker();
    if (callInvoker == nullptr) {
      return std::string("NitroModules.install(): the ReactContext CallInvoker was null.");
    }

    auto dispatcher = std::make_shared<margelo::nitro::CallInvokerDispatcher>(callInvoker);
    margelo::nitro::install(*runtime, dispatcher);
    return std::nullopt;
  } catch (const std::exception &exc) {
    return std::string("NitroModules.install() threw: ") + exc.what();
  } catch (...) {
    return std::string("NitroModules.install() threw an unknown error.");
  }
}

} // namespace winrt::NitroModules
