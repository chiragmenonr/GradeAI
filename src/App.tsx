import { useState, useEffect } from 'react';
import type { ClassData, ClassAnalysis } from './types';
import { ClassCard } from './components/ClassCard';
import { ResultsDashboard } from './components/ResultsDashboard';
import { SubjectRadar } from './components/SubjectRadar';
import { DashboardSkeleton } from './components/Skeleton';
import { calculateWeightedGrade } from './utils/gradeCalculations';
import { streamAnalysis, parseInsightSections } from './api/analyzeGrades';

function blankClass(): ClassData {
  return {
    id: crypto.randomUUID(),
    subject: '',
    assignments: [{ id: crypto.randomUUID(), name: '', score: '', maxPoints: '100' }],
    midterm: { score: '', maxPoints: '100', weight: '' },
    final: { score: '', maxPoints: '100', weight: '' },
  };
}

function makeSampleClasses(): ClassData[] {
  const uid = () => crypto.randomUUID();
  return [
    {
      id: uid(), subject: 'Math',
      assignments: [
        { id: uid(), name: 'Homework 1',                   score: '10',  maxPoints: '10',  type: 'HW', date: '2024-09-16' },
        { id: uid(), name: 'Quiz 1',                       score: '28',  maxPoints: '30',  type: 'QZ', date: '2024-09-22' },
        { id: uid(), name: 'Assignment 1',                 score: '12',  maxPoints: '12',  type: 'GA', date: '2024-10-01' },
        { id: uid(), name: 'Test 1',                       score: '98',  maxPoints: '100', type: 'TS', date: '2024-10-10' },
        { id: uid(), name: 'Quiz 2',                       score: '29',  maxPoints: '30',  type: 'QZ', date: '2024-11-04' },
        { id: uid(), name: 'Test 2',                       score: '82',  maxPoints: '100', type: 'TS', date: '2024-11-24' },
        { id: uid(), name: 'Quiz 3',                       score: '48',  maxPoints: '50',  type: 'QZ', date: '2024-12-17' },
        { id: uid(), name: 'Assignment 2',                 score: '15',  maxPoints: '15',  type: 'GA', date: '2024-12-23' },
        { id: uid(), name: 'Quiz 4',                       score: '9',   maxPoints: '10',  type: 'QZ', date: '2025-01-14' },
        { id: uid(), name: 'Test 3',                       score: '99',  maxPoints: '100', type: 'TS', date: '2025-04-15' },
        { id: uid(), name: 'Assignment 3 (extra credit)',  score: '22',  maxPoints: '20',  type: 'XC', date: '2025-04-27', isExtraCredit: true },
        { id: uid(), name: 'Test 4',                       score: '100', maxPoints: '100', type: 'TS', date: '2025-05-21' },
      ],
      midterm: { score: '', maxPoints: '100', weight: '' },
      final:   { score: '', maxPoints: '100', weight: '' },
    },
    {
      id: uid(), subject: 'English',
      assignments: [
        { id: uid(), name: 'Homework 1',                   score: '9',   maxPoints: '10',  type: 'HW', date: '2024-09-18' },
        { id: uid(), name: 'Quiz 1',                       score: '13',  maxPoints: '30',  type: 'QZ', date: '2024-09-30' },
        { id: uid(), name: 'Assignment 1',                 score: '88',  maxPoints: '90',  type: 'GA', date: '2024-10-14' },
        { id: uid(), name: 'Test 1',                       score: '41',  maxPoints: '100', type: 'TS', date: '2024-10-28' },
        { id: uid(), name: 'Homework 2',                   score: '0',   maxPoints: '10',  type: 'HW', date: '2024-11-10' },
        { id: uid(), name: 'Assignment 2 (extra credit)',  score: '55',  maxPoints: '50',  type: 'XC', date: '2024-11-20', isExtraCredit: true },
        { id: uid(), name: 'Quiz 2',                       score: '27',  maxPoints: '30',  type: 'QZ', date: '2024-12-05' },
        { id: uid(), name: 'Test 2',                       score: '94',  maxPoints: '100', type: 'TS', date: '2025-01-15' },
        { id: uid(), name: 'Assignment 3',                 score: '91',  maxPoints: '100', type: 'GA', date: '2025-03-10' },
        { id: uid(), name: 'Quiz 3',                       score: '12',  maxPoints: '30',  type: 'QZ', date: '2025-04-02' },
        { id: uid(), name: 'Homework 3',                   score: '0',   maxPoints: '10',  type: 'HW', date: '2025-05-01' },
        { id: uid(), name: 'Test 3',                       score: '88',  maxPoints: '100', type: 'TS', date: '2025-05-20' },
      ],
      midterm: { score: '', maxPoints: '100', weight: '' },
      final:   { score: '', maxPoints: '100', weight: '' },
    },
    {
      id: uid(), subject: 'Spanish',
      assignments: [
        { id: uid(), name: 'Homework 1',  score: '4',  maxPoints: '10',  type: 'HW', date: '2024-09-15' },
        { id: uid(), name: 'Quiz 1',      score: '14', maxPoints: '25',  type: 'QZ', date: '2024-09-26' },
        { id: uid(), name: 'Homework 2',  score: '5',  maxPoints: '10',  type: 'HW', date: '2024-10-10' },
        { id: uid(), name: 'Test 1',      score: '38', maxPoints: '100', type: 'TS', date: '2024-10-24' },
        { id: uid(), name: 'Assignment 1',score: '80', maxPoints: '100', type: 'GA', date: '2024-11-07' },
        { id: uid(), name: 'Quiz 2',      score: '13', maxPoints: '25',  type: 'QZ', date: '2024-11-21' },
        { id: uid(), name: 'Homework 3',  score: '3',  maxPoints: '10',  type: 'HW', date: '2024-12-12' },
        { id: uid(), name: 'Test 2',      score: '44', maxPoints: '100', type: 'TS', date: '2025-01-16' },
        { id: uid(), name: 'Quiz 3',      score: '16', maxPoints: '25',  type: 'QZ', date: '2025-02-20' },
        { id: uid(), name: 'Assignment 2',score: '72', maxPoints: '100', type: 'GA', date: '2025-03-15' },
        { id: uid(), name: 'Homework 4',  score: '0',  maxPoints: '10',  type: 'HW', date: '2025-04-10' },
        { id: uid(), name: 'Test 3',      score: '41', maxPoints: '100', type: 'TS', date: '2025-05-15' },
      ],
      midterm: { score: '', maxPoints: '100', weight: '' },
      final:   { score: '', maxPoints: '100', weight: '' },
    },
  ];
}

function loadStored<T>(key: string, fallback: T): T {
  try {
    const s = localStorage.getItem(key);
    if (s) return JSON.parse(s) as T;
  } catch {}
  return fallback;
}

export default function App() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('gradeai-theme');
    const dark = saved !== null ? saved === 'dark' : true;
    document.documentElement.classList.toggle('dark', dark);
    return dark;
  });

  const [classes, setClasses] = useState<ClassData[]>(() => {
    const saved = loadStored<ClassData[]>('gradeai-classes', []);
    return saved.length > 0 ? saved : [blankClass()];
  });

  const [analyses, setAnalyses] = useState<ClassAnalysis[]>(() =>
    loadStored<ClassAnalysis[]>('gradeai-analyses', [])
  );

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [streamingText, setStreamingText] = useState<Record<string, string>>(() => {
    const saved = loadStored<ClassAnalysis[]>('gradeai-analyses', []);
    const texts: Record<string, string> = {};
    for (const a of saved) {
      if (a.trends || a.motivationalInsight) {
        texts[a.classId] = [
          a.trends ? `[TRENDS]\n${a.trends}` : '',
          a.motivationalInsight ? `[INSIGHT]\n${a.motivationalInsight}` : '',
        ].filter(Boolean).join('\n\n');
      }
    }
    return texts;
  });

  const [streamingDone, setStreamingDone] = useState<Record<string, boolean>>(() => {
    const saved = loadStored<ClassAnalysis[]>('gradeai-analyses', []);
    const done: Record<string, boolean> = {};
    for (const a of saved) {
      if (a.trends || a.motivationalInsight) done[a.classId] = true;
    }
    return done;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('gradeai-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  useEffect(() => {
    localStorage.setItem('gradeai-classes', JSON.stringify(classes));
  }, [classes]);

  useEffect(() => {
    localStorage.setItem('gradeai-analyses', JSON.stringify(analyses));
  }, [analyses]);

  function updateClass(id: string, updated: ClassData) {
    setClasses(prev => prev.map(c => c.id === id ? updated : c));
    if (analyses.length > 0) {
      const weighted = calculateWeightedGrade(updated);
      setAnalyses(prev => prev.map(a =>
        a.classId === id
          ? { ...a, ...weighted, subject: updated.subject || 'General' }
          : a
      ));
    }
  }

  function removeClass(id: string) {
    setClasses(prev => {
      const next = prev.filter(c => c.id !== id);
      return next.length > 0 ? next : [blankClass()];
    });
    setAnalyses(prev => prev.filter(a => a.classId !== id));
  }

  function loadSample() {
    const sample = makeSampleClasses();
    setClasses(sample);
    setAnalyses([]);
    setStreamingText({});
    setStreamingDone({});
    setError(null);
  }

  async function handleAnalyze() {
    setError(null);

    for (const c of classes) {
      const hasGrades = c.assignments.some(a => a.score !== '' && a.maxPoints !== '')
        || (c.midterm.score !== '' && c.midterm.maxPoints !== '')
        || (c.final.score !== '' && c.final.maxPoints !== '');
      if (!hasGrades) {
        setError(`"${c.subject || 'Unnamed class'}" has no grades entered yet.`);
        return;
      }
      const mw = parseFloat(c.midterm.weight) || 0;
      const fw = parseFloat(c.final.weight) || 0;
      if (mw + fw > 100) {
        setError(`"${c.subject || 'Unnamed class'}" — exam weights total ${mw + fw}%, which exceeds 100%.`);
        return;
      }
    }

    setIsAnalyzing(true);
    setStreamingText({});
    setStreamingDone({});

    const initialAnalyses: ClassAnalysis[] = classes.map(c => {
      const weighted = calculateWeightedGrade(c);
      return {
        classId: c.id,
        subject: c.subject || 'General',
        ...weighted,
        trends: '',
        motivationalInsight: '',
      };
    });
    setAnalyses(initialAnalyses);
    setIsAnalyzing(false);

    await Promise.all(
      classes.map(async c => {
        const weighted = calculateWeightedGrade(c);
        let accumulated = '';

        try {
          for await (const chunk of streamAnalysis(c.subject || 'General', weighted)) {
            accumulated += chunk;
            const snapshot = accumulated;
            setStreamingText(prev => ({ ...prev, [c.id]: snapshot }));
          }

          const { trends, motivationalInsight } = parseInsightSections(accumulated);
          setAnalyses(prev => prev.map(a =>
            a.classId === c.id ? { ...a, trends, motivationalInsight } : a
          ));
        } catch {
          // silently leave trends/motivationalInsight empty on stream error
        }

        setStreamingDone(prev => ({ ...prev, [c.id]: true }));
      })
    );
  }

  const showResults = analyses.length > 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f0f1a] px-4 py-10 transition-colors duration-200">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="relative mb-8 text-center">
          <button
            onClick={() => setIsDark(d => !d)}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="absolute right-0 top-0 rounded-lg p-2 text-slate-400 dark:text-white/40 transition hover:bg-black/5 dark:hover:bg-white/10 hover:text-slate-600 dark:hover:text-white/70"
          >
            {isDark ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4"/>
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>
          <h1 className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-4xl font-bold text-transparent">
            GradeAI
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-white/45">AI-powered grade analysis and insights</p>
        </div>

        {/* Sample data loader */}
        <button
          onClick={loadSample}
          className="mb-4 w-full rounded-xl border border-dashed border-slate-300 dark:border-white/15 py-2.5 text-sm text-slate-400 dark:text-white/35 transition hover:border-purple-400/60 dark:hover:border-purple-500/40 hover:text-purple-500 dark:hover:text-purple-400/70"
        >
          ✦ Try sample data — Math, English &amp; Spanish
        </button>

        {/* Class input cards */}
        <div className="space-y-4">
          {classes.map(c => (
            <ClassCard
              key={c.id}
              classData={c}
              onChange={updated => updateClass(c.id, updated)}
              onRemove={() => removeClass(c.id)}
            />
          ))}
        </div>

        <button
          onClick={() => setClasses(prev => [...prev, blankClass()])}
          className="mt-3 w-full rounded-xl border border-dashed border-purple-500/25 py-3 text-sm text-purple-400/55 transition hover:border-purple-500/50 hover:text-purple-400"
        >
          + Add another class
        </button>

        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="mt-3 w-full rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 py-3 font-semibold text-white transition hover:from-purple-500 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isAnalyzing ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Analyzing…
            </span>
          ) : (
            `Analyze ${classes.length} Class${classes.length !== 1 ? 'es' : ''}`
          )}
        </button>

        {error && (
          <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {isAnalyzing && (
          <div className="mt-8">
            <DashboardSkeleton />
          </div>
        )}

        {showResults && !isAnalyzing && (
          <div className="mt-10 space-y-10">
            {analyses.length >= 2 && <SubjectRadar analyses={analyses} />}
            {analyses.map(a => (
              <ResultsDashboard
                key={a.classId}
                analysis={a}
                classData={classes.find(c => c.id === a.classId)!}
                streamingText={streamingText[a.classId] ?? ''}
                streamingDone={streamingDone[a.classId] ?? false}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
