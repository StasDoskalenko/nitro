#pragma once

#include "Dispatcher.hpp"

namespace margelo::nitro {

// Minimal UI-thread `Dispatcher` for Windows. Nitro only needs this for
// `ThreadUtils::createUIThreadDispatcher()`; Hybrid Views (which would drive real
// UI-thread scheduling) are not supported on Windows yet.
class UIThreadDispatcher : public Dispatcher {
public:
  void runSync(std::function<void()> &&function) override;
  void runAsync(std::function<void()> &&function) override;
};

} // namespace margelo::nitro
