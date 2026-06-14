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

function loadStored<T>(key: string, fallback: T): T {
  try {
    const s = localStorage.getItem(key);
    if (s) return JSON.parse(s) as T;
  } catch {}
  return fallback;
}

export default function App() {
  const [classes, setClasses] = useState<ClassData[]>(() => {
    const saved = loadStored<ClassData[]>('gradeai-classes', []);
    return saved.length > 0 ? saved : [blankClass()];
  });

  const [analyses, setAnalyses] = useState<ClassAnalysis[]>(() =>
    loadStored<ClassAnalysis[]>('gradeai-analyses', [])
  );

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reconstruct streaming state from persisted analyses on first load
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
    localStorage.setItem('gradeai-classes', JSON.stringify(classes));
  }, [classes]);

  useEffect(() => {
    localStorage.setItem('gradeai-analyses', JSON.stringify(analyses));
  }, [analyses]);

  function updateClass(id: string, updated: ClassData) {
    setClasses(prev => prev.map(c => c.id === id ? updated : c));
    // Live-update the analysis for this class if results are showing
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

  async function handleAnalyze() {
    setError(null);

    // Validate
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

    // Phase 1: compute grades synchronously — dashboard appears immediately
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

    // Phase 2: stream AI insights for each class in parallel
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

          // Parse the completed stream into structured fields
          const { trends, motivationalInsight } = parseInsightSections(accumulated);
          setAnalyses(prev => prev.map(a =>
            a.classId === c.id ? { ...a, trends, motivationalInsight } : a
          ));
        } catch {
          // Silently leave trends/motivationalInsight empty on stream error
        }

        setStreamingDone(prev => ({ ...prev, [c.id]: true }));
      })
    );
  }

  const showResults = analyses.length > 0;

  return (
    <div className="min-h-screen bg-[#0f0f1a] px-4 py-10">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-4xl font-bold text-transparent">
            GradeAI
          </h1>
          <p className="mt-2 text-sm text-white/45">AI-powered grade analysis and insights</p>
        </div>

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

        {/* Results */}
        {isAnalyzing && (
          <div className="mt-8">
            <DashboardSkeleton />
          </div>
        )}

        {showResults && !isAnalyzing && (
          <div className="mt-10 space-y-10">
            {/* Radar chart when 2+ classes */}
            {analyses.length >= 2 && <SubjectRadar analyses={analyses} />}

            {/* Per-class dashboards */}
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
