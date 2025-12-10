import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Get the project root directory (where package.json is located)
 */
const getProjectRoot = (): string => {
  // Get the directory of this file
  const currentFile = fileURLToPath(import.meta.url);
  const currentDir = path.dirname(currentFile);

  // Navigate up from src/utils to project root
  return path.resolve(currentDir, '..', '..');
};

/**
 * Get the path to a file in the src/data directory
 * This works both in development (from src/) and production (from dist/)
 * by always reading from the source location
 */
export const getDataPath = (relativePath: string): string => {
  const projectRoot = getProjectRoot();
  return path.join(projectRoot, 'src', 'data', relativePath);
};
