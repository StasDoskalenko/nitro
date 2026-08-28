import { NitroConfig } from '../../config/NitroConfig.js'
import { isNotDuplicate } from '../../syntax/helpers.js'
import type { SourceFile } from '../../syntax/SourceFile.js'

/**
 * On iOS a Nitro module's headers are reachable as `<ModuleName/Header.hpp>` via
 * the podspec `header_dir`; on Android via the prefab. MSVC has no such header
 * map, so nitrogen emits a `<ModuleName>/` folder of one-line shims next to the
 * generated code (`nitrogen/generated/windows/<ModuleName>/*.hpp`), each pointing
 * back at the real shared header.
 *
 * A module that depends on this one adds
 * `<dependency>/nitrogen/generated/windows` to its include path (see the
 * generated `<Name>+autolinking.props`), which makes
 * `#include <ModuleName/Header.hpp>` resolve.
 */
export function createHeaderShims(files: SourceFile[]): SourceFile[] {
  const moduleName = NitroConfig.current.getWindowsProjectName()

  return files
    .filter(
      (f) =>
        f.platform === 'shared' &&
        f.language === 'c++' &&
        f.name.endsWith('.hpp')
    )
    .map((f) => [...f.subdirectory, f.name].join('/'))
    .filter(isNotDuplicate)
    .map((relativeHeader) => {
      // shim lives at nitrogen/generated/windows/<ModuleName>/<sub>/<Header>.hpp,
      // the real header at nitrogen/generated/shared/c++/<sub>/<Header>.hpp -
      // so climb out past <Header>, <sub>, <ModuleName> and windows/.
      const parts = relativeHeader.split('/')
      const upToGeneratedRoot = '../'.repeat(parts.length + 1)
      const target = `${upToGeneratedRoot}shared/c++/${relativeHeader}`
      const name = parts.pop() as string
      return {
        content: `#pragma once\n#include "${target}"\n`,
        name,
        language: 'c++',
        platform: 'windows',
        subdirectory: [moduleName, ...parts],
      } satisfies SourceFile
    })
}
