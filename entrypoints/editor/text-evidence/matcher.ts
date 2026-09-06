import { normalize } from './normalize';
import { ExpectedText, OCRResult, MatchResult, MatchStatus } from './types';

const FOUND_THRESHOLD = 0.95;
const POSSIBLE_THRESHOLD = 0.75;

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const prev = new Array(n + 1);
  const curr = new Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= n; j++) prev[j] = curr[j];
  }
  return prev[n];
}

function similarity(a: string, b: string): number {
  if (a === b) return 1;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

function mergeWords(words: OCRResult[]): OCRResult {
  const x = Math.min(...words.map((w) => w.x));
  const y = Math.min(...words.map((w) => w.y));
  const right = Math.max(...words.map((w) => w.x + w.width));
  const bottom = Math.max(...words.map((w) => w.y + w.height));
  return {
    text: words.map((w) => w.text).join(' '),
    x,
    y,
    width: right - x,
    height: bottom - y,
  };
}

function buildCandidates(ocrWords: OCRResult[], expectedWordCounts: number[]): OCRResult[] {
  const ngramSizes = new Set(expectedWordCounts.filter((n) => n > 0));
  if (ngramSizes.size === 0) ngramSizes.add(1);
  const candidates: OCRResult[] = [...ocrWords];
  for (const n of ngramSizes) {
    if (n <= 1) continue;
    for (let i = 0; i + n <= ocrWords.length; i++) {
      candidates.push(mergeWords(ocrWords.slice(i, i + n)));
    }
  }
  return candidates;
}

function bboxOverlaps(a: OCRResult, b: OCRResult): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

// Each expected line matches every occurrence found in the image (not just one).
export function matchTexts(expected: ExpectedText[], ocrWords: OCRResult[]): MatchResult[] {
  const wordCounts = expected.map((e) => e.raw.trim().split(/\s+/).filter(Boolean).length);
  const candidates = buildCandidates(ocrWords, wordCounts);

  const results: MatchResult[] = [];

  for (const e of expected) {
    const normExpected = normalize(e.raw);
    const scored: { candidate: OCRResult; score: number }[] = [];
    for (const c of candidates) {
      const normCandidate = normalize(c.text);
      const score =
        c.text === e.raw || normCandidate === normExpected
          ? 1
          : similarity(normExpected, normCandidate);
      if (score >= POSSIBLE_THRESHOLD) scored.push({ candidate: c, score });
    }
    scored.sort((a, b) => b.score - a.score);

    const picked: typeof scored = [];
    for (const s of scored) {
      if (picked.some((p) => bboxOverlaps(p.candidate, s.candidate))) continue;
      picked.push(s);
    }

    if (picked.length === 0) {
      results.push({ expectedIndex: e.index, expectedRaw: e.raw, status: MatchStatus.NOT_FOUND, similarity: 0 });
      continue;
    }

    for (const p of picked) {
      results.push({
        expectedIndex: e.index,
        expectedRaw: e.raw,
        status: p.score >= FOUND_THRESHOLD ? MatchStatus.FOUND : MatchStatus.POSSIBLE_MATCH,
        ocrResult: p.candidate,
        similarity: p.score,
      });
    }
  }

  return results;
}
