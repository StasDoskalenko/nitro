#include "UIThreadDispatcher.hpp"

#include <stdexcept>

namespace margelo::nitro {

void UIThreadDispatcher::runSync(std::function<void()> && /* function */)
{
  throw std::runtime_error("UIThreadDispatcher::runSync() is not implemented on Windows");
}

void UIThreadDispatcher::runAsync(std::function<void()> &&function)
{
  // No Hybrid Views on Windows yet, so nothing schedules onto a separate UI thread.
  function();
}

} // namespace margelo::nitro
