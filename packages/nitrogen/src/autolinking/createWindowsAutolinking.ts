import type { SourceFile } from '../syntax/SourceFile.js'
import type { Autolinking } from './Autolinking.js'
import { createHeaderShims } from './windows/createHeaderShims.js'
import { createHybridObjectInitializer } from './windows/createHybridObjectInitializer.js'
import { createMSBuildExtension } from './windows/createMSBuildExtension.js'

interface WindowsAutolinking extends Autolinking {}

export function createWindowsAutolinking(
  allFiles: SourceFile[]
): WindowsAutolinking {
  const msbuildExtension = createMSBuildExtension(allFiles)
  const hybridObjectInitializer = createHybridObjectInitializer()
  const headerShims = createHeaderShims(allFiles)

  return {
    platform: 'windows',
    sourceFiles: [
      ...msbuildExtension,
      ...hybridObjectInitializer,
      ...headerShims,
    ],
  }
}
