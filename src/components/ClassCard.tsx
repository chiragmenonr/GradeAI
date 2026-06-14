import { useState, useRef } from 'react';
import type { ClassData, Assignment, ExamEntry } from '../types';
import type { ParsedClassData } from '../api/parseGrades';
import { parseGradesFromText, parseGradesFromPDF } from '../api/parseGrades';

interface Props {
  classData: ClassData;
  onChange: (updated: ClassData) => void;
  onRemove: () => void;
}

const TYPE_COLORS: Record<string, string> = {
  HW: 'bg-blue-500/15 text-blue-600 dark:text-blue-300',
  QZ: 'bg-purple-500/15 text-purple-600 dark:text-purple-300',
  TS: 'bg-red-500/15 text-red-600 dark:text-red-300',
  GA: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-300',
  XC: 'bg-green-500/15 text-green-600 dark:text-green-300',
};

const inputCls = 'rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-1.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/25 focus:border-purple-500/60 focus:outline-none';

function parsedToClassData(parsed: ParsedClassData): Partial<ClassData> {
  return {
    subject: parsed.subject || undefined,
    weightConfig: parsed.weightConfig,
    assignments: parsed.assignments.map(a => ({
      id: crypto.randomUUID(),
      name: a.name,
      score: String(a.score),
      maxPoints: String(a.maxPoints),
      date: a.date,
      type: a.type?.toUpperCase(),
      isExtraCredit: a.isExtraCredit ?? (a.maxPoints === 0 || a.score > a.maxPoints),
    })),
  };
}

function getInitialMode(cd: ClassData): 'input' | 'edit' {
  return cd.assignments.some(a => a.score !== '') ? 'edit' : 'input';
}

const TYPE_LONG: Record<string, string> = {
  HW: 'Homework',
  QZ: 'Quiz',
  TS: 'Test',
  GA: 'Graded Assignment',
  XC: 'Extra Credit',
};

export function ClassCard({ classData, onChange, onRemove }: Props) {
  const [mode, setMode] = useState<'input' | 'edit'>(() => getInitialMode(classData));
  const [rawText, setRawText] = useState(classData.rawInput ?? '');
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasDate = classData.assignments.some(a => !!a.date);
  const hasType = classData.assignments.some(a => !!a.type);
  const hasWeightConfig = !!classData.weightConfig && Object.keys(classData.weightConfig).length > 0;
  const midtermW = parseFloat(classData.midterm.weight) || 0;
  const finalW = parseFloat(classData.final.weight) || 0;
  const overBudget = midtermW + finalW > 100;

  const gridCols = [hasType && '60px', '1fr', hasDate && '100px', '70px', '70px', '28px']
    .filter(Boolean)
    .join(' ');

  const displayAssignments = hasDate
    ? [...classData.assignments].sort((a, b) => {
        if (!a.date && !b.date) return 0;
        if (!a.date) return 1;
        if (!b.date) return -1;
        const cmp = a.date.localeCompare(b.date);
        return sortOrder === 'asc' ? cmp : -cmp;
      })
    : classData.assignments;

  async function runParse(fn: () => Promise<ParsedClassData>) {
    setIsParsing(true);
    setParseError(null);
    try {
      const parsed = await fn();
      const updates = parsedToClassData(parsed);
      onChange({
        ...classData,
        ...updates,
        subject: updates.subject || classData.subject,
        rawInput: rawText,
      });
      setMode('edit');
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Parsing failed — check your input or API key.');
    } finally {
      setIsParsing(false);
    }
  }

  function handleParseText() {
    if (!rawText.trim()) return;
    runParse(() => parseGradesFromText(rawText));
  }

  function handlePDFUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    runParse(async () => {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = ev => resolve((ev.target!.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      setRawText(`[PDF: ${file.name}]`);
      return parseGradesFromPDF(base64);
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function updateAssignment(id: string, field: keyof Assignment, value: string) {
    onChange({
      ...classData,
      assignments: classData.assignments.map(a => a.id === id ? { ...a, [field]: value } : a),
    });
  }

  function removeAssignment(id: string) {
    onChange({ ...classData, assignments: classData.assignments.filter(a => a.id !== id) });
  }

  function addAssignment() {
    onChange({
      ...classData,
      assignments: [...classData.assignments, { id: crypto.randomUUID(), name: '', score: '', maxPoints: '100' }],
    });
  }

  function updateExam(exam: 'midterm' | 'final', field: keyof ExamEntry, value: string) {
    onChange({ ...classData, [exam]: { ...classData[exam], [field]: value } });
  }

  function goManual() {
    onChange({ ...classData, assignments: [{ id: crypto.randomUUID(), name: '', score: '', maxPoints: '100' }] });
    setMode('edit');
  }

  return (
    <div className="relative rounded-xl border border-purple-500/25 dark:border-purple-500/30 bg-white dark:bg-white/5 shadow-[0_0_15px_rgba(168,85,247,0.08)] dark:shadow-[0_0_20px_rgba(168,85,247,0.12)]">
      {/* Parse loading overlay */}
      {isParsing && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl bg-white/90 dark:bg-[#0f0f1a]/85 backdrop-blur-sm">
          <svg className="h-8 w-8 animate-spin text-purple-400" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="mt-3 text-sm text-slate-600 dark:text-white/70">Parsing with AI…</p>
          <p className="mt-1 text-xs text-slate-400 dark:text-white/30">Large datasets may take a moment</p>
        </div>
      )}

      <div className="p-5">
        {/* Header row */}
        <div className="mb-4 flex items-center gap-3">
          <input
            type="text"
            placeholder="Class / Subject name"
            value={classData.subject}
            onChange={e => onChange({ ...classData, subject: e.target.value })}
            className="flex-1 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/30 focus:border-purple-500 focus:outline-none"
          />
          {mode === 'edit' && (
            <button
              onClick={() => setMode('input')}
              className="rounded-lg px-3 py-1.5 text-xs text-slate-400 dark:text-white/35 transition hover:bg-black/5 dark:hover:bg-white/5 hover:text-slate-600 dark:hover:text-white/60"
            >
              Re-parse
            </button>
          )}
          <button onClick={onRemove} className="rounded-lg p-2 text-slate-300 dark:text-white/25 transition hover:bg-red-500/10 hover:text-red-400">✕</button>
        </div>

        {mode === 'input' ? (
          /* ───────── INPUT MODE ───────── */
          <div>
            <textarea
              placeholder={"Paste any grade data — SIS export, teacher emails, gradebook text, anything…\n\nExample:\n  Math Quiz 1: 28/30  (2025-09-15)\n  HW 5: 2/2\n  Unit Test: 91/100"}
              value={rawText}
              onChange={e => setRawText(e.target.value)}
              rows={7}
              className="mb-3 w-full resize-none rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-3 font-mono text-sm text-slate-800 dark:text-white/90 placeholder-slate-300 dark:placeholder-white/20 focus:border-purple-500/60 focus:outline-none"
            />
            {parseError && <p className="mb-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">{parseError}</p>}
            <div className="flex items-center gap-2">
              <button
                onClick={handleParseText}
                disabled={!rawText.trim() || isParsing}
                className="flex-1 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 py-2.5 text-sm font-semibold text-white transition hover:from-purple-500 hover:to-blue-500 disabled:opacity-50"
              >
                ✦ Parse with AI
              </button>
              <label className="cursor-pointer rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-white/5 px-4 py-2.5 text-sm text-slate-500 dark:text-white/55 transition hover:bg-slate-50 dark:hover:bg-white/10 hover:text-slate-700 dark:hover:text-white/80">
                Upload PDF
                <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={handlePDFUpload} />
              </label>
            </div>
            <button onClick={goManual} className="mt-3 w-full text-center text-xs text-slate-400 dark:text-white/25 transition hover:text-slate-600 dark:hover:text-white/45">
              Or add grades manually →
            </button>
          </div>
        ) : (
          /* ───────── EDIT MODE ───────── */
          <div>
            {/* Weight config pills */}
            {hasWeightConfig && (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {Object.entries(classData.weightConfig!).map(([k, v]) => (
                  <span key={k} className="rounded-full bg-purple-500/15 px-2.5 py-0.5 text-xs text-purple-600 dark:text-purple-300">
                    {k} {(v * 100).toFixed(0)}%
                  </span>
                ))}
              </div>
            )}

            {/* Column headers */}
            <div className="mb-2 grid items-center gap-2 px-1 text-xs text-slate-400 dark:text-white/30" style={{ gridTemplateColumns: gridCols }}>
              {hasType && <span>Type</span>}
              <span>Assignment</span>
              {hasDate && (
                <div className="flex items-center justify-center gap-1">
                  <span>Date</span>
                  <button
                    onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}
                    title={sortOrder === 'asc' ? 'Oldest first — click for newest' : 'Newest first — click for oldest'}
                    className="text-slate-400 dark:text-white/30 hover:text-slate-600 dark:hover:text-white/60 transition leading-none"
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
              )}
              <span className="text-center">Score</span>
              <span className="text-center">Max pts</span>
              <span />
            </div>

            {/* Assignment rows */}
            <div className="max-h-80 space-y-1.5 overflow-y-auto pr-0.5">
              {displayAssignments.map(a => {
                const score = parseFloat(a.score);
                const max = parseFloat(a.maxPoints);
                const isZero = !isNaN(score) && score === 0 && !isNaN(max) && max > 0;
                const isEC = a.isExtraCredit
                  || (!isNaN(max) && max === 0 && !isNaN(score) && score > 0)
                  || (!isNaN(score) && !isNaN(max) && max > 0 && score > max);

                return (
                  <div key={a.id} className="grid items-center gap-2" style={{ gridTemplateColumns: gridCols }}>
                    {hasType && (
                      editingTypeId === a.id ? (
                        <select
                          value={a.type ?? ''}
                          onChange={e => { updateAssignment(a.id, 'type', e.target.value); setEditingTypeId(null); }}
                          onBlur={() => setEditingTypeId(null)}
                          autoFocus
                          className="w-full rounded bg-slate-50 dark:bg-white/10 border border-slate-200 dark:border-white/20 px-1 py-0.5 text-xs text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                        >
                          <option value="">—</option>
                          {Object.entries(TYPE_LONG).map(([code, label]) => (
                            <option key={code} value={code}>{label}</option>
                          ))}
                        </select>
                      ) : (
                        <span
                          onClick={() => setEditingTypeId(a.id)}
                          title="Click to change type"
                          className={`cursor-pointer rounded px-1.5 py-0.5 text-center text-xs font-medium ${TYPE_COLORS[a.type?.toUpperCase() ?? ''] ?? 'bg-slate-100 dark:bg-white/8 text-slate-400 dark:text-white/35'}`}
                        >
                          {a.type ?? '—'}
                        </span>
                      )
                    )}
                    <input
                      type="text"
                      value={a.name}
                      onChange={e => updateAssignment(a.id, 'name', e.target.value)}
                      placeholder="Assignment name"
                      className={`${inputCls} ${isZero ? 'border-red-500/25' : ''} ${isEC ? 'border-green-500/25' : ''}`}
                    />
                    {hasDate && (
                      <input
                        type="text"
                        value={a.date ?? ''}
                        onChange={e => updateAssignment(a.id, 'date', e.target.value)}
                        placeholder="YYYY-MM-DD"
                        className={`${inputCls} text-center text-xs`}
                      />
                    )}
                    <input
                      type="number"
                      min="0"
                      value={a.score}
                      onChange={e => updateAssignment(a.id, 'score', e.target.value)}
                      placeholder="85"
                      className={`${inputCls} text-center ${isZero ? 'text-red-400' : ''} ${isEC ? 'text-green-500 dark:text-green-400' : ''}`}
                    />
                    <input
                      type="number"
                      min="0"
                      value={a.maxPoints}
                      onChange={e => updateAssignment(a.id, 'maxPoints', e.target.value)}
                      placeholder="100"
                      className={`${inputCls} text-center`}
                    />
                    <button
                      onClick={() => removeAssignment(a.id)}
                      className="flex h-7 w-7 items-center justify-center rounded text-slate-300 dark:text-white/20 transition hover:text-red-400"
                    >✕</button>
                  </div>
                );
              })}
            </div>

            <button onClick={addAssignment} className="mb-5 mt-2 text-sm text-purple-500/70 dark:text-purple-400/60 transition hover:text-purple-600 dark:hover:text-purple-400">
              + Add assignment
            </button>

            {/* Midterm/Final */}
            {!hasWeightConfig && (
              <div className="rounded-lg border border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-black/20 p-4">
                <p className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-white/30">Midterm &amp; Final Exam</p>
                <div className="mb-2 grid grid-cols-[72px_70px_70px_1fr] gap-2 px-1 text-xs text-slate-400 dark:text-white/30">
                  <span /><span className="text-center">Score</span><span className="text-center">Max pts</span><span className="pl-3">% of grade</span>
                </div>
                {(['midterm', 'final'] as const).map(exam => (
                  <div key={exam} className="mb-2 grid grid-cols-[72px_70px_70px_1fr] items-center gap-2">
                    <span className="text-sm capitalize text-slate-500 dark:text-white/55">{exam}</span>
                    <input type="number" min="0" placeholder="Score" value={classData[exam].score}
                      onChange={e => updateExam(exam, 'score', e.target.value)} className={`${inputCls} text-center`} />
                    <input type="number" min="1" placeholder="100" value={classData[exam].maxPoints}
                      onChange={e => updateExam(exam, 'maxPoints', e.target.value)} className={`${inputCls} text-center`} />
                    <div className="flex items-center gap-2 pl-3">
                      <input type="number" min="0" max="100" placeholder="0" value={classData[exam].weight}
                        onChange={e => updateExam(exam, 'weight', e.target.value)}
                        className="w-16 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-2 py-1.5 text-center text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/25 focus:border-blue-500/60 focus:outline-none" />
                      <span className="text-sm text-slate-400 dark:text-white/40">%</span>
                    </div>
                  </div>
                ))}
                <div className={`mt-2 rounded px-3 py-1.5 text-xs ${overBudget ? 'bg-red-500/10 text-red-400' : 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-white/30'}`}>
                  {overBudget
                    ? `Exam weights total ${(midtermW + finalW).toFixed(0)}% — must be ≤ 100%.`
                    : `Assignments: ${Math.max(0, 100 - midtermW - finalW).toFixed(0)}% · Midterm: ${midtermW.toFixed(0)}% · Final: ${finalW.toFixed(0)}%`}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
