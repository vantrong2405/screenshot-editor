import type { DrawingElement } from '../Editor';
import { MatchResult, MatchStatus } from './types';

const FOUND_COLOR = '#FF0000';
const POSSIBLE_COLOR = '#FFA500';
const SOURCE = 'text-evidence';
const BBOX_PADDING = 8;
const BBOX_STROKE_WIDTH = 3;

export function buildAnnotations(
  matches: MatchResult[],
  startCounter: number
): { elements: DrawingElement[]; nextCounter: number } {
  const elements: DrawingElement[] = [];
  let counter = startCounter;

  for (const m of matches) {
    if (m.status === MatchStatus.NOT_FOUND || !m.ocrResult) continue;

    const number = m.expectedIndex + 1;
    const color = m.status === MatchStatus.FOUND ? FOUND_COLOR : POSSIBLE_COLOR;
    const x = m.ocrResult.x - BBOX_PADDING;
    const y = m.ocrResult.y - BBOX_PADDING;
    const width = m.ocrResult.width + BBOX_PADDING * 2;
    const height = m.ocrResult.height + BBOX_PADDING * 2;

    elements.push({
      id: `evidence-rect-${counter}`,
      type: 'rectangle',
      source: SOURCE,
      x,
      y,
      width,
      height,
      color,
      strokeWidth: BBOX_STROKE_WIDTH,
      filled: false,
      visible: true,
      name: `Evidence ${counter}`,
    });
    counter++;

    elements.push({
      id: `evidence-label-${counter}`,
      type: 'text',
      source: SOURCE,
      x: x - 4,
      y: y - 24,
      text: String(number),
      color,
      strokeColor: '#FFFFFF',
      strokeWidth: 4,
      fontSize: 20,
      visible: true,
      name: `Evidence ${counter}`,
    });
    counter++;
  }

  return { elements, nextCounter: counter };
}
