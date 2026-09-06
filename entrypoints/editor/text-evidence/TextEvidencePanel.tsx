import React, { useRef, useState } from 'react';
import './TextEvidencePanel.css';
import { MatchResult, MatchStatus } from './types';

interface TextEvidencePanelProps {
  onGenerate: (lines: string[]) => Promise<MatchResult[]>;
  onApply: (matches: MatchResult[]) => void;
}

function statusClass(status: MatchStatus): string {
  switch (status) {
    case MatchStatus.FOUND: return 'te-status-found';
    case MatchStatus.POSSIBLE_MATCH: return 'te-status-possible';
    case MatchStatus.NOT_FOUND: return 'te-status-not-found';
  }
}

function statusLabel(status: MatchStatus): string {
  switch (status) {
    case MatchStatus.FOUND: return 'Found';
    case MatchStatus.POSSIBLE_MATCH: return 'Possible';
    case MatchStatus.NOT_FOUND: return 'Not found';
  }
}

export function TextEvidencePanel({ onGenerate, onApply }: TextEvidencePanelProps) {
  const [input, setInput] = useState('');
  const [results, setResults] = useState<MatchResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  const rawLines = input.split('\n');
  const lines = rawLines.map((l) => l.trim()).filter(Boolean);

  const syncGutterScroll = () => {
    if (textareaRef.current && gutterRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleGenerate = async () => {
    if (lines.length === 0 || loading) return;
    setLoading(true);
    try {
      const matches = await onGenerate(lines);
      setResults(matches);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (results) onApply(results);
  };

  return (
    <div className="te-panel">
      <div className="te-input-shell">
        <div className="te-gutter" ref={gutterRef}>
          {rawLines.map((_, i) => <span key={i}>{i + 1}</span>)}
        </div>
        <textarea
          ref={textareaRef}
          className="te-textarea"
          placeholder="Each line = one text to verify"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onScroll={syncGutterScroll}
          wrap="off"
          spellCheck={false}
        />
      </div>
      <button className="te-generate-btn" disabled={lines.length === 0 || loading} onClick={handleGenerate}>
        {loading ? 'Generating...' : 'Generate Evidence'}
      </button>

      {results && (
        <>
          <div className="te-results">
            {results.map((r, i) => (
              <div key={i} className={`te-result-row ${statusClass(r.status)}`}>
                <span className="te-badge">{r.expectedIndex + 1}</span>
                <span className="te-result-text" title={r.expectedRaw}>{r.expectedRaw}</span>
                <span className="te-result-status">{statusLabel(r.status)}</span>
              </div>
            ))}
          </div>
          <button className="te-apply-btn" onClick={handleApply}>
            Add to Canvas
          </button>
        </>
      )}
    </div>
  );
}
