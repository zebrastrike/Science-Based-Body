import fs from 'fs';
import path from 'path';

const legacyRoots = [
  process.cwd(),
  path.resolve(process.cwd(), '..'),
  path.resolve(process.cwd(), '..', '..'),
];

export function readLegacyFile(fileName: string): string {
  for (const root of legacyRoots) {
    const candidate = path.join(root, fileName);
    if (fs.existsSync(candidate)) {
      return fs.readFileSync(candidate, 'utf-8');
    }
  }

  throw new Error(`Legacy file not found: ${fileName}`);
}
