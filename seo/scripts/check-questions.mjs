// Validates the question bank: every question/answer present in all 9 languages, no empty strings,
// no duplicate questions (per language), no leftover English inside non-English questions.
// Run: node scripts/check-questions.mjs
import { QUESTIONS } from '../data/questions.mjs';
const L = ['en', 'es', 'pt', 'fr', 'de', 'it', 'ro', 'pl', 'tr'];
const problems = []; let total = 0;
const seen = Object.fromEntries(L.map((l) => [l, new Map()]));
for (const [k, qs] of Object.entries(QUESTIONS)) {
  qs.forEach((q, i) => {
    total++;
    const id = `${k}#${i + 1} (${q.q.en})`;
    for (const l of L) {
      const t = q.q[l];
      if (!t || !t.trim()) problems.push(`${id}: missing question [${l}]`);
      else {
        const key = t.toLowerCase();
        if (seen[l].has(key)) problems.push(`${id}: duplicate [${l}] of ${seen[l].get(key)}`); else seen[l].set(key, id);
        if (l !== 'en' && t === q.q.en) problems.push(`${id}: [${l}] identical to English`);
      }
      const a = typeof q.a === 'string' ? q.a : q.a[l] ?? q.a.en; // same fallback as the build: unchanged names reuse English
      if (!a || !String(a).trim()) problems.push(`${id}: missing answer [${l}]`);
    }
  });
}
console.log(`${total} questions in ${Object.keys(QUESTIONS).length} categories: ` + Object.entries(QUESTIONS).map(([k, v]) => `${k} ${v.length}`).join(', '));
console.log(problems.length ? problems.join('\n') : 'All questions complete in 9 languages, no duplicates.');
process.exitCode = problems.length ? 1 : 0;
