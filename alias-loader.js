import { readFileSync } from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, resolve as pathResolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read jsconfig.json for path mappings
const jsconfig = JSON.parse(readFileSync(pathResolve(__dirname, 'jsconfig.json'), 'utf8'));
const paths = jsconfig.compilerOptions.paths;

export async function resolve(specifier, context, nextResolve) {
  for (const [alias, targets] of Object.entries(paths)) {
    const aliasPattern = alias.replace('/*', '');

    if (specifier.startsWith(aliasPattern)) {
      const targetPattern = targets[0].replace('/*', '');
      const relativePath = specifier.replace(aliasPattern, '');
      const resolvedPath = pathResolve(__dirname, targetPattern + relativePath);

      try {
        return {
          shortCircuit: true,
          url: pathToFileURL(resolvedPath).href
        };
      } catch {
        // Continue to next alias if this one fails
      }
    }
  }

  // Fallback to default resolution
  return nextResolve(specifier, context);
}