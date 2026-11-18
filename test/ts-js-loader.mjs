import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

export async function resolve(specifier, context, nextResolve) {
  if (specifier.endsWith('.js') && (specifier.startsWith('.') || specifier.startsWith('/'))) {
    const resolved = new URL(specifier, context.parentURL)
    for (const candidate of [
      resolved.href.replace(/\.js$/, '.ts'),
      resolved.href.replace(/\.js$/, '.tsx'),
    ]) {
      if (existsSync(fileURLToPath(candidate))) {
        return { url: candidate, shortCircuit: true }
      }
    }
  }
  return nextResolve(specifier, context)
}
