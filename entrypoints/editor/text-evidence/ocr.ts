import { createWorker, type Worker, type Word } from 'tesseract.js';
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

export async function runOCR(image: HTMLImageElement): Promise<OCRResult[]> {
  const cached = cache.get(image.src);
  if (cached) return cached;

  const worker = await getWorker();
  const { data } = await worker.recognize(image, {}, { blocks: true });

  const words: Word[] = (data.blocks ?? []).flatMap((b) =>
    b.paragraphs.flatMap((p) => p.lines.flatMap((l) => l.words))
  );

  const results: OCRResult[] = words.map((w) => ({
    text: w.text,
    x: w.bbox.x0,
    y: w.bbox.y0,
    width: w.bbox.x1 - w.bbox.x0,
    height: w.bbox.y1 - w.bbox.y0,
  }));

  cache.set(image.src, results);
  return results;
}
