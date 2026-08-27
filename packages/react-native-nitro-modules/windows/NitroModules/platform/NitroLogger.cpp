#include "NitroLogger.hpp"
#include "NitroDefines.hpp"

#include <string>
#include <windows.h>

// Windows implementation of the platform-specific `nativeLog` hook declared in
// `cpp/platform/NitroLogger.hpp` (iOS and Android provide their own).

namespace margelo::nitro {

void Logger::nativeLog([[maybe_unused]] LogLevel level, [[maybe_unused]] const char *NON_NULL tag,
                       [[maybe_unused]] const std::string &message)
{
#ifdef NITRO_DEBUG
  std::string line = std::string("[Nitro.") + tag + "] " + message + "\n";
  OutputDebugStringA(line.c_str());
#endif
}

} // namespace margelo::nitro
