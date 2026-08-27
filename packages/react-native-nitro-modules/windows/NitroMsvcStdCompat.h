#pragma once

// Nitro's C++ sources rely on transitive libc++ includes that MSVC's STL does not
// pull in implicitly. `NitroModules.props` force-includes this header into every
// translation unit so those standard headers are always available.

#include <exception>
#include <functional>
#include <memory>
#include <mutex>
#include <optional>
#include <regex>
#include <sstream>
#include <stdexcept>
#include <string>
#include <unordered_map>
#include <vector>
