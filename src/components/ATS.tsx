import React from 'react'

interface Suggestion {
  type: "good" | "improve";
  tip: string;
}

interface ATSProps {
  score: number;
  suggestions: Suggestion[];
}

const ATS: React.FC<ATSProps> = ({ score, suggestions }) => {
  const isGood = score > 69;
  const isOk = score > 49;

  let accentColor = "text-rose-600";
  let bgClass = "bg-rose-50 border-rose-100";
  let title = "Needs Improvement";

  if (isGood) {
    accentColor = "text-emerald-600";
    bgClass = "bg-emerald-50 border-emerald-100";
    title = "ATS Optimized";
  } else if (isOk) {
    accentColor = "text-amber-600";
    bgClass = "bg-amber-50 border-amber-100";
    title = "Needs Work";
  }

  return (
    <div className={`rounded-xl border p-6 ${bgClass}`}>
      <div className="flex items-start gap-4 mb-4">
        <div className={`p-2 rounded-lg bg-white ${accentColor}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">{title} ({score}/100)</h2>
          <p className="text-sm text-slate-600 mt-1">
            Likelihood to pass automated ATS filters.
          </p>
        </div>
      </div>

      <div className="space-y-3 pl-1">
        {suggestions.map((suggestion, index) => (
          <div key={index} className="flex items-start gap-3 text-sm">
            <span className={`mt-0.5 flex-shrink-0 ${suggestion.type === "good" ? "text-emerald-600" : "text-amber-600"}`}>
              {suggestion.type === "good" ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              )}
            </span>
            <span className="text-slate-700 leading-relaxed">
              {suggestion.tip}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ATS
