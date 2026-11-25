// Builds studio/shorts.html: a local "Shorts studio" that animates 100 vertical trivia clips per language
// (1080x1920, ~26 s, 3 questions each) and exports them as video files (MP4 in Chrome/Edge, WebM fallback).
// Also writes studio/captions-<lang>.txt with a ready caption + hashtags per clip.
// Run: node scripts/shorts.mjs   then open studio/shorts.html in Chrome or Edge.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LANGS, CAT_KEYS } from '../data/i18n.mjs';
import { QUESTIONS } from '../data/questions.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'studio');
const CLIPS = 100, PER = 3;

const S = {
  en: { hook: 'Can you answer all 3?', sub: '5 seconds each', end: 'How many did you get?', cmt: 'Comment your score 👇', play: 'Play 1v1 trivia for free', tags: '#trivia #quiz #generalknowledge #triviachallenge #quiztime #brainteaser' },
  es: { hook: '¿Aciertas las 3?', sub: '5 segundos cada una', end: '¿Cuántas acertaste?', cmt: 'Escribe tu puntuación 👇', play: 'Juega 1v1 gratis', tags: '#trivia #quiz #culturageneral #preguntas #quiztime' },
  pt: { hook: 'Você acerta as 3?', sub: '5 segundos cada', end: 'Quantas você acertou?', cmt: 'Comente sua pontuação 👇', play: 'Jogue 1v1 grátis', tags: '#quiz #conhecimentosgerais #perguntas #trivia #desafio' },
  fr: { hook: 'Tu trouves les 3 ?', sub: '5 secondes chacune', end: 'Combien as-tu trouvé ?', cmt: 'Dis ton score en commentaire 👇', play: 'Joue en 1v1 gratuitement', tags: '#quiz #culturegenerale #trivia #question #defi' },
  de: { hook: 'Weißt du alle 3?', sub: 'Je 5 Sekunden', end: 'Wie viele hattest du?', cmt: 'Schreib deinen Score in die Kommentare 👇', play: 'Spiel 1v1 kostenlos', tags: '#quiz #allgemeinwissen #trivia #rätsel #quizzeit' },
  it: { hook: 'Sai rispondere a tutte e 3?', sub: '5 secondi ciascuna', end: 'Quante ne hai indovinate?', cmt: 'Scrivi il tuo punteggio 👇', play: 'Gioca 1v1 gratis', tags: '#quiz #culturagenerale #trivia #domande #sfida' },
  ro: { hook: 'Poți răspunde la toate 3?', sub: '5 secunde fiecare', end: 'Câte ai știut?', cmt: 'Scrie scorul în comentarii 👇', play: 'Joacă 1v1 gratuit', tags: '#quiz #culturagenerala #intrebari #trivia #romania' },
  pl: { hook: 'Odpowiesz na wszystkie 3?', sub: '5 sekund na każde', end: 'Ile masz punktów?', cmt: 'Napisz wynik w komentarzu 👇', play: 'Zagraj 1v1 za darmo', tags: '#quiz #wiedzaogolna #pytania #trivia #wyzwanie' },
  tr: { hook: '3 soruyu da bilebilir misin?', sub: 'Her biri 5 saniye', end: 'Kaç tane bildin?', cmt: 'Puanını yorumlara yaz 👇', play: '1v1 ücretsiz oyna', tags: '#quiz #genelkültür #bilgiyarışması #trivia #soru' },
};

// Round-robin over categories so the 3 questions of a clip always come from 3 different topics.
const rounds = Math.max(...CAT_KEYS.map((k) => QUESTIONS[k].length));
const ORDER = [];
for (let r = 0; r < rounds; r++) for (const k of CAT_KEYS) if (QUESTIONS[k][r]) ORDER.push({ k, q: QUESTIONS[k][r] });

const data = {};
mkdirSync(OUT, { recursive: true });
for (const l of Object.keys(LANGS)) {
  const ans = (a) => (typeof a === 'string' ? a : a[l] ?? a.en);
  const clips = [];
  for (let c = 0; c < CLIPS; c++) clips.push(ORDER.slice(c * PER, c * PER + PER).map(({ k, q }) => [LANGS[l].cats[k][0], q.q[l], ans(q.a)]));
  data[l] = { name: LANGS[l].name, s: S[l], clips };
  writeFileSync(join(OUT, `captions-${l}.txt`), clips.map((cl, i) =>
    `#${String(i + 1).padStart(2, '0')}  ${S[l].hook} 🧠 ${cl.map((x) => x[0]).join(' · ')}\n${S[l].play}: 1v1game.net\n${S[l].tags}\n`).join('\n'));
}

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>1v1game · Shorts studio</title>
<style>body{margin:0;font:15px/1.5 system-ui,sans-serif;background:#2b2118;color:#fff;display:flex;gap:24px;padding:24px;flex-wrap:wrap}
canvas{height:min(86vh,960px);aspect-ratio:9/16;border-radius:16px;background:#fff1d1}
.p{max-width:420px;display:flex;flex-direction:column;gap:12px}select,button{font:inherit;padding:10px 12px;border-radius:10px;border:0}
button{background:#e8513b;color:#fff;font-weight:700;cursor:pointer}button.g{background:#fff;color:#2b2118}button:disabled{opacity:.5}
.row{display:flex;gap:8px;flex-wrap:wrap}#log{font-size:13px;opacity:.8;white-space:pre-wrap}textarea{width:100%;height:120px;font:13px/1.4 monospace;border-radius:10px}</style></head>
<body><canvas id="cv" width="1080" height="1920"></canvas>
<div class="p"><h2 style="margin:0">Shorts studio · 1v1game</h2>
<p>${CLIPS} de clipuri verticale (1080×1920, ~26 s) pe limbă. „Exportă” înregistrează clipul în timp real și îl descarcă. <b>Ține tab-ul deschis și în față cât exportă</b> (browserul încetinește animațiile în tab-urile din fundal).</p>
<div class="row"><select id="lang"></select><select id="clip"></select></div>
<div class="row"><button class="g" id="play">▶ Preview</button><button id="exp">⬇ Exportă clipul</button><button id="all">⬇ Exportă toate ${CLIPS}</button></div>
<label>Descriere + hashtag-uri (copiază la postare):</label><textarea id="cap" readonly></textarea>
<div id="log"></div>
<p style="font-size:13px;opacity:.7">Fără sunet: adaugă un sunet popular direct în TikTok/Reels/Shorts (crește reach-ul). Format: MP4 în Chrome/Edge recente, altfel WebM (TikTok și YouTube îl acceptă; pentru Instagram convertește în MP4 cu CapCut).</p></div>
<script>
const DATA = ${JSON.stringify(data).replace(/</g, '\\u003c')};
const cv = document.getElementById('cv'), x = cv.getContext('2d'), W = 1080, H = 1920;
const $ = (id) => document.getElementById(id);
const HOOK = 2.2, Q = 5, A = 2.2, END = 3.2, TOTAL = HOOK + 3 * (Q + A) + END;
const C = { bg1: '#fff1d1', bg2: '#ffd6a0', text: '#2b2118', muted: '#6f5f4d', accent: '#e8513b', good: '#2f9e5b', card: '#ffffff' };
const F = (w, s) => w + ' ' + s + 'px system-ui, "Segoe UI", "Segoe UI Emoji", Roboto, sans-serif';

function wrap(t, maxW, font) { x.font = font; const words = String(t).split(' '); const lines = []; let cur = '';
  for (const w of words) { const test = cur ? cur + ' ' + w : w; if (x.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; } else cur = test; }
  if (cur) lines.push(cur); return lines; }
function text(t, y, size, { w = 800, color = C.text, maxW = 900, lh = 1.2 } = {}) {
  const lines = wrap(t, maxW, F(w, size)); x.fillStyle = color; x.textAlign = 'center'; x.textBaseline = 'middle';
  const start = y - ((lines.length - 1) * size * lh) / 2; lines.forEach((ln, i) => x.fillText(ln, W / 2, start + i * size * lh)); return lines.length * size * lh; }
function rr(px, py, w, h, r, fill) { x.beginPath(); x.roundRect(px, py, w, h, r); x.fillStyle = fill; x.fill(); }
const ease = (t) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);

function frame(L, clip, t) {
  const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, C.bg1); g.addColorStop(1, C.bg2); x.fillStyle = g; x.fillRect(0, 0, W, H);
  x.font = F(900, 64); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = C.text; x.fillText('1v1', W / 2 - 70, 150); x.fillStyle = C.accent; x.fillText('game', W / 2 + 70, 150);
  const s = DATA[L].s, qs = DATA[L].clips[clip];
  if (t < HOOK) { const k = ease(t / 0.5); x.globalAlpha = k; text(s.hook, H / 2 - 80, 104, { w: 900 }); text('⏱ ' + s.sub, H / 2 + 120, 56, { color: C.muted, w: 600 }); x.globalAlpha = 1; return; }
  let u = t - HOOK;
  for (let i = 0; i < 3; i++) {
    if (u < Q + A) {
      const [cat, q, a] = qs[i];
      rr(90, 300, W - 180, 110, 55, C.text); text((i + 1) + '/3 · ' + cat.toUpperCase(), 355, 44, { color: '#fff', w: 800 });
      rr(70, 520, W - 140, 700, 48, C.card); text(q, 870, 74, { w: 800, maxW: W - 260 });
      if (u < Q) { const left = Q - u, p = left / Q;
        x.beginPath(); x.arc(W / 2, 1450, 120, 0, Math.PI * 2); x.fillStyle = '#ffffffaa'; x.fill();
        x.beginPath(); x.arc(W / 2, 1450, 120, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p); x.lineWidth = 22; x.strokeStyle = C.accent; x.stroke();
        text(String(Math.ceil(left)), 1450, 110, { w: 900, color: C.accent });
      } else { const k = ease((u - Q) / 0.35); x.globalAlpha = k; rr(110, 1330, W - 220, 260, 40, C.good); text('✓ ' + a, 1460, 72, { color: '#fff', w: 900, maxW: W - 300 }); x.globalAlpha = 1; }
      return;
    }
    u -= Q + A;
  }
  const k = ease(u / 0.5); x.globalAlpha = k;
  text(s.end, 760, 96, { w: 900 }); text(s.cmt, 930, 58, { color: C.muted, w: 600 });
  rr(110, 1180, W - 220, 300, 48, C.accent); text(s.play, 1280, 60, { color: '#fff', w: 800, maxW: W - 300 }); text('1v1game.net', 1390, 84, { color: '#fff', w: 900 });
  x.globalAlpha = 1;
}

let raf = 0;
function run(L, clip, onEnd) { cancelAnimationFrame(raf); const t0 = performance.now();
  const step = (now) => { const t = (now - t0) / 1000; frame(L, clip, Math.min(t, TOTAL)); if (t < TOTAL) raf = requestAnimationFrame(step); else onEnd && onEnd(); };
  raf = requestAnimationFrame(step); }

function pickMime() { for (const m of ['video/mp4;codecs=avc1.42E01E', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm']) if (MediaRecorder.isTypeSupported(m)) return m; return ''; }
function record(L, clip) { return new Promise((res) => {
  const mime = pickMime(), stream = cv.captureStream(30), rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8e6 }), chunks = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  rec.onstop = () => { const ext = mime.includes('mp4') ? 'mp4' : 'webm'; const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(chunks, { type: mime })); a.download = '1v1game-' + L + '-' + String(clip + 1).padStart(2, '0') + '.' + ext; a.click();
    log('✓ ' + a.download); res(); };
  rec.start(); run(L, clip, () => setTimeout(() => rec.stop(), 150)); }); }
const log = (m) => { $('log').textContent = m + '\\n' + $('log').textContent; };

for (const [l, d] of Object.entries(DATA)) $('lang').add(new Option(d.name, l));
for (let i = 0; i < ${CLIPS}; i++) $('clip').add(new Option('Clip ' + (i + 1), i));
$('lang').value = 'en';
const cap = () => { const L = $('lang').value, i = +$('clip').value, d = DATA[L];
  $('cap').value = d.s.hook + ' 🧠 ' + d.clips[i].map((q) => q[0]).join(' · ') + '\\n' + d.s.play + ': 1v1game.net\\n' + d.s.tags; frame(L, i, 1); };
$('lang').onchange = cap; $('clip').onchange = cap; cap();
$('play').onclick = () => run($('lang').value, +$('clip').value);
const busy = (b) => ['exp', 'all', 'play'].forEach((id) => ($(id).disabled = b));
$('exp').onclick = async () => { busy(true); await record($('lang').value, +$('clip').value); busy(false); };
$('all').onclick = async () => { busy(true); for (let i = 0; i < ${CLIPS}; i++) { $('clip').value = i; cap(); await record($('lang').value, i); } busy(false); };
</script></body></html>
`;
writeFileSync(join(OUT, 'shorts.html'), html);
console.log(`studio/shorts.html: ${CLIPS} clips x ${Object.keys(LANGS).length} languages; captions in studio/captions-<lang>.txt`);
