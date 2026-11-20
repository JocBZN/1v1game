/**
 * npm run validate:puzzles
 *
 * Checks every puzzle in data/chess_puzzles.json with chess.js: the FEN loads, every move of the
 * solution (including the opponent's forced replies) is legal, and the line ends in checkmate or a
 * clear material win. Failing puzzles are REMOVED from the file.
 *   --dry   report only, don't rewrite the file
 */
import fs from 'node:fs';
import { dataFile } from '../src/paths';
import { validatePuzzle, type Puzzle } from '../src/chess/puzzles';

const file = dataFile('chess_puzzles.json');
const dry = process.argv.includes('--dry');
const puzzles = JSON.parse(fs.readFileSync(file, 'utf8')) as Puzzle[];

const kept: Puzzle[] = [];
const ids = new Set<string>();
let removed = 0;
const byTheme: Record<string, number> = {};

for (const p of puzzles) {
  const r = ids.has(p.id) ? { ok: false, reason: 'duplicate id' } : validatePuzzle(p);
  if (r.ok) {
    kept.push(p);
    ids.add(p.id);
    byTheme[p.theme] = (byTheme[p.theme] ?? 0) + 1;
  } else {
    removed++;
    console.log(`✗ ${p.id}: ${r.reason}`);
  }
}

console.log(`\n${kept.length} valid, ${removed} removed. By theme: ${JSON.stringify(byTheme)}`);
if (removed && !dry) {
  fs.writeFileSync(file, JSON.stringify(kept, null, 1) + '\n');
  console.log('The file was rewritten without the invalid puzzles.');
}
if (kept.length < 60) {
  console.error('Warning: fewer than 60 valid puzzles.');
  process.exitCode = 1;
}
