export function normalize(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, ' ');
}
