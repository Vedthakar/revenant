"use client";

interface HabitScoreDisplayProps {
  score: number;
}

function getScoreTone(score: number) {
  if (score < 40) {
    return {
      border: "border-red-500/40",
      bg: "bg-red-500/10",
      text: "text-red-300",
      caption: "Needs attention",
    };
  }
  if (score <= 70) {
    return {
      border: "border-amber-500/40",
      bg: "bg-amber-500/10",
      text: "text-amber-300",
      caption: "Building consistency",
    };
  }
  return {
    border: "border-emerald-500/40",
    bg: "bg-emerald-500/10",
    text: "text-emerald-300",
    caption: "Healthy trajectory",
  };
}

export default function HabitScoreDisplay({ score }: HabitScoreDisplayProps) {
  const tone = getScoreTone(score);

  return (
    <div className={`glass flex flex-col gap-4 rounded-[28px] border p-8 ${tone.border}`}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--text-muted)]">Habit health score</p>
          <h2 className="mt-3 text-5xl font-semibold text-[var(--text)]">{Math.round(score)}</h2>
        </div>
        <div className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] ${tone.border} ${tone.bg} ${tone.text}`}>
          {tone.caption}
        </div>
      </div>
      <p className="max-w-md text-sm leading-6 text-[var(--text-muted)]">
        Revenant uses this rolling 30-day signal to surface strong patterns, weak patterns, and the activity most likely to be promoted into company memory.
      </p>
    </div>
  );
}
