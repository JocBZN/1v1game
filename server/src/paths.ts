import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));

/** Root of the `server/` package. */
export const SERVER_ROOT = path.resolve(here, '..');
export const DATA_DIR = path.join(SERVER_ROOT, 'data');

export function dataFile(name: string): string {
  return path.join(DATA_DIR, name);
}
