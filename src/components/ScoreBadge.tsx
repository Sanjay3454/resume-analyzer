interface ScoreBadgeProps {
  score: number;
}

const ScoreBadge: React.FC<ScoreBadgeProps> = ({ score }) => {
  let badgeClasses = '';
  let badgeText = '';

  if (score > 70) {
    badgeClasses = 'bg-emerald-50 text-emerald-700 ring-emerald-600/20';
    badgeText = 'Strong';
  } else if (score > 49) {
    badgeClasses = 'bg-amber-50 text-amber-700 ring-amber-600/20';
    badgeText = 'Good Start';
  } else {
    badgeClasses = 'bg-rose-50 text-rose-700 ring-rose-600/20';
    badgeText = 'Needs Work';
  }

  return (
    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${badgeClasses}`}>
      {badgeText}
    </div>
  );
};

export default ScoreBadge;
