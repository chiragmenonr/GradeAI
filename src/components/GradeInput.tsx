import { useState } from 'react';

interface Props {
  onAnalyze: (gradesText: string, subject: string) => void;
  isLoading: boolean;
}

export function GradeInput({ onAnalyze, isLoading }: Props) {
  const [gradesText, setGradesText] = useState('');
  const [subject, setSubject] = useState('');

  return (
    <div className="rounded-xl border border-purple-500/30 bg-white/5 p-6 shadow-[0_0_20px_rgba(168,85,247,0.15)]">
      <h2 className="mb-4 text-xl font-semibold text-purple-300">Enter Your Grades</h2>

      <input
        type="text"
        placeholder="Subject / Class name (e.g. Math, Physics)"
        value={subject}
        onChange={e => setSubject(e.target.value)}
        className="mb-3 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-white/40 focus:border-purple-500 focus:outline-none"
      />

      <textarea
        placeholder={'Paste your grades here\ne.g. "85, 90, 72, 88" or "Math: 85 90 72"'}
        value={gradesText}
        onChange={e => setGradesText(e.target.value)}
        rows={4}
        className="mb-4 w-full resize-none rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-white/40 focus:border-purple-500 focus:outline-none"
      />

      <button
        onClick={() => onAnalyze(gradesText, subject)}
        disabled={isLoading || !gradesText.trim()}
        className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 py-3 font-semibold text-white transition hover:from-purple-500 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Analyzing…
          </span>
        ) : (
          'Analyze Grades'
        )}
      </button>
    </div>
  );
}
