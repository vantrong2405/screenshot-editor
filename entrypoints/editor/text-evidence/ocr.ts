import { createWorker, type Worker } from 'tesseract.js';
import { OCRResult } from './types';

let workerPromise: Promise<Worker> | null = null;
const cache = new Map<string, OCRResult[]>();

function getWorker(): Promise<Worker> {
  if (!workerPromise) {
    const langFileUrl = browser.runtime.getURL('/tesseract/eng.traineddata.gz');
    workerPromise = createWorker('eng', 1, {
      workerPath: browser.runtime.getURL('/tesseract/worker.min.js'),
      corePath: browser.runtime.getURL('/tesseract/tesseract-core-lstm.js'),
      langPath: langFileUrl.slice(0, langFileUrl.lastIndexOf('/')),
      gzip: true,
      workerBlobURL: false,
    });
  }
  return workerPromise;
}

const MAX_CACHE_ENTRIES = 5;

export async function runOCR(image: HTMLImageElement): Promise<OCRResult[]> {
  const cached = cache.get(image.src);
  if (cached) return cached;

  const worker = await getWorker();
  const { data } = await worker.recognize(image, {}, { blocks: true });

  const results: OCRResult[] = [];
  let lineId = 0;
  for (const b of data.blocks ?? []) {
    for (const p of b.paragraphs) {
      for (const l of p.lines) {
        for (const w of l.words) {
          results.push({
            text: w.text,
            x: w.bbox.x0,
            y: w.bbox.y0,
            width: w.bbox.x1 - w.bbox.x0,
            height: w.bbox.y1 - w.bbox.y0,
            lineId,
          });
        }
        lineId++;
      }
    }
  }

  if (cache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey !== undefined) cache.delete(oldestKey);
  }
  cache.set(image.src, results);
  return results;
}
