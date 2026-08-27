import type { SourceFile } from '../syntax/SourceFile.js'
import type { Autolinking } from './Autolinking.js'
import { createHybridObjectInitializer } from './windows/createHybridObjectInitializer.js'
import { createMSBuildExtension } from './windows/createMSBuildExtension.js'

interface WindowsAutolinking extends Autolinking {}

export function createWindowsAutolinking(
  allFiles: SourceFile[]
): WindowsAutolinking {
  const msbuildExtension = createMSBuildExtension(allFiles)
  const hybridObjectInitializer = createHybridObjectInitializer()

  return {
    platform: 'windows',
    sourceFiles: [...msbuildExtension, ...hybridObjectInitializer],
  }
}
