const fs = require('fs');
const md = fs.readFileSync('D:/download/vue面试题-2026.md', 'utf-8');

function detectTags(t) { return ['test']; }
function generateId(t, i) { return 'id_' + i; }

function parseMarkdown(c) {
  const lines = c.split('\n');
  const cards = [];
  let cq = null;
  let ca = [];
  let idx = 0;

  function flush() {
    if (cq) {
      const a = ca.filter(l => l.trim()).join('\n').trim();
      if (a) {
        cards.push({ q: cq.trim(), a, idx });
        idx++;
      } else {
        console.log('SKIPPED (empty answer):', cq.trim().substring(0, 60));
      }
    }
    cq = null;
    ca = [];
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const t = line.trim();
    if (!t || t.startsWith('![') || t.startsWith('```')) {
      if (t.startsWith('```')) {
        i++;
        while (i < lines.length && !lines[i].trim().startsWith('```')) i++;
      }
      continue;
    }
    const m = t.match(/^(\d+)[.、]\s*(.+)/);
    if (m && !t.match(/^(\d+)[.、]\s+[-*]\s/) && !t.match(/^(\d+)[.、]\s+\d+[.、]/)) {
      const q = m[2].trim();
      const hm = q.includes('？') || q.includes('?');
      const ind = line.match(/^\s{2,}/);
      if (hm || !ind) {
        flush();
        cq = q;
        continue;
      }
    }
    if (cq) {
      const bm = t.match(/^[-*]\s+(.+)/);
      const sm = t.match(/^(\d+)[.、]\s+(.+)/);
      if (bm) ca.push('- ' + bm[1]);
      else if (sm) ca.push(sm[1] + '. ' + sm[2]);
      else if (t.match(/^#{1,3}\s/)) continue;
      else ca.push(t);
    }
  }
  flush();
  return cards;
}

const result = parseMarkdown(md);
console.log('\nTotal parsed:', result.length);
