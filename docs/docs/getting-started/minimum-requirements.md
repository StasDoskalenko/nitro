---
description: Check the React Native, iOS, Android, Swift, Kotlin, Gradle, and C++ requirements needed to use Nitro Modules.
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Minimum Requirements

Nitro is a Framework built on top of newer APIs like `jsi::NativeState`.
To use Nitro, make sure your app meets the minimum requirements:

<Tabs groupId="platform">
  <TabItem value="ios" label="iOS" default>
    - react-native 0.75 or higher
    - Xcode 16.4 or higher
    - Swift 5.9 or higher
  </TabItem>
  <TabItem value="android" label="Android">
    - react-native 0.75 or higher
    - `compileSdkVersion` 34 or higher
    - `ndkVersion` 27 or higher
  </TabItem>
  <TabItem value="windows" label="Windows">
    - react-native-windows 0.84 or higher (New Architecture)
    - Visual Studio 2022 (MSVC v143) or 2026 (MSVC v145)
    - Windows SDK 10.0.26100

    Windows support is experimental — see the [Windows guide](../guides/windows).
  </TabItem>
</Tabs>
