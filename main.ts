import { cpSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const root = fileURLToPath(new URL('./', import.meta.url));
const destination = process.env.MAKEFUN_OUTPUT_DIR || '/output';
mkdirSync(destination, { recursive: true });

function treeBytes(directory: string): number {
  let bytes = 0;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) bytes += treeBytes(path);
    else if (entry.isFile()) bytes += statSync(path).size;
    else throw new Error(`Expected a regular game file or directory at ${path}`);
  }
  return bytes;
}

const sourceBytes = treeBytes(join(root, 'game'));
for (const directory of ['game', 'screenshots']) {
  cpSync(join(root, directory), join(destination, directory), { recursive: true });
}
const copiedBytes = treeBytes(join(destination, 'game'));
if (sourceBytes !== copiedBytes) {
  throw new Error(`Copied game has ${copiedBytes} bytes, expected ${sourceBytes}`);
}

const dossier = buildDossier(destination, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(destination, 'dossier.json'), dossier);
