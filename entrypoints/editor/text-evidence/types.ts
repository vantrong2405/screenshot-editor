export interface ExpectedText {
  index: number;
  raw: string;
}

export interface OCRResult {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  lineId: number;
}

export enum MatchStatus {
  FOUND = 'FOUND',
  POSSIBLE_MATCH = 'POSSIBLE_MATCH',
  NOT_FOUND = 'NOT_FOUND',
}

export interface MatchResult {
  expectedIndex: number;
  expectedRaw: string;
  status: MatchStatus;
  ocrResult?: OCRResult;
  similarity: number;
}
