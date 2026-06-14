interface Props {
  text: string;    // raw accumulated streaming text (may be partial)
  isDone: boolean;
}

function renderSection(raw: string, isDone: boolean) {
  // Split on section markers and render them as styled headers
  const parts = raw.split(/(\[TRENDS\]|\[INSIGHT\])/g);
  const nodes: React.ReactNode[] = [];
  let currentSection = '';

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part === '[TRENDS]') {
      currentSection = 'TRENDS';
      nodes.push(
        <p key={`h-${i}`} className="mb-1 text-xs font-semibold uppercase tracking-wider text-indigo-400">
          Performance Trends
        </p>
      );
    } else if (part === '[INSIGHT]') {
      currentSection = 'INSIGHT';
      nodes.push(
        <p key={`h-${i}`} className="mb-1 mt-4 text-xs font-semibold uppercase tracking-wider text-pink-400">
          Coach's Insight
        </p>
      );
    } else if (part.trim()) {
      const isLast = i === parts.length - 1;
      nodes.push(
        <p key={`t-${i}`} className={`text-sm leading-relaxed ${currentSection === 'INSIGHT' ? 'italic text-white/75' : 'text-white/80'}`}>
          {part.trimStart()}
          {isLast && !isDone && (
            <span className="inline-block w-0.5 animate-[blink_1s_step-end_infinite] bg-purple-400 align-middle ml-0.5 h-4" />
          )}
        </p>
      );
    }
  }

  return nodes;
}

export function StreamingInsight({ text, isDone }: Props) {
  const isEmpty = !text.trim();

  return (
    <div className={`rounded-xl border bg-white/5 p-5 transition-all duration-300 ${
      !isDone
        ? 'border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.25)] pulse-glow'
        : 'border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.1)]'
    }`}>
      {/* Header */}
      <div className="mb-3 flex items-center gap-2">
        <div className={`flex h-6 w-6 items-center justify-center rounded-full bg-purple-500/20 text-sm ${!isDone ? 'animate-pulse' : ''}`}>
          ✦
        </div>
        <span className="text-sm font-semibold text-purple-300">AI Analysis</span>
        {!isDone && (
          <span className="ml-auto text-xs text-white/30">
            <span className="animate-[blink_1s_step-end_infinite]">Generating</span>
            <span className="animate-[blink_1s_step-end_infinite_0.33s]">.</span>
            <span className="animate-[blink_1s_step-end_infinite_0.66s]">.</span>
            <span className="animate-[blink_1s_step-end_infinite_1s]">.</span>
          </span>
        )}
      </div>

      {/* Content */}
      {isEmpty ? (
        <div className="space-y-2">
          <div className="h-3 w-full animate-pulse rounded bg-white/10" />
          <div className="h-3 w-5/6 animate-pulse rounded bg-white/10" />
          <div className="h-3 w-4/6 animate-pulse rounded bg-white/10" />
        </div>
      ) : (
        <div>{renderSection(text, isDone)}</div>
      )}
    </div>
  );
}
