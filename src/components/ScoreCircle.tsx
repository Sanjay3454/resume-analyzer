const ScoreCircle = ({ score = 75 }: { score: number }) => {
    const radius = 40;
    const stroke = 8;
    const normalizedRadius = radius - stroke / 2;
    const circumference = 2 * Math.PI * normalizedRadius;
    const progress = score / 100;
    const strokeDashoffset = circumference * (1 - progress);

    // Determine color based on score for visual feedback
    const getColor = (s: number) => {
        if (s >= 70) return "#10b981"; // Emerald-500
        if (s >= 50) return "#f59e0b"; // Amber-500
        return "#ef4444"; // Rose-500
    };

    const strokeColor = getColor(score);

    return (
        <div className="relative w-[80px] h-[80px]">
            <svg
                height="100%"
                width="100%"
                viewBox="0 0 100 100"
                className="transform -rotate-90"
            >
                {/* Background circle */}
                <circle
                    cx="50"
                    cy="50"
                    r={normalizedRadius}
                    stroke="#f1f5f9"
                    strokeWidth={stroke}
                    fill="transparent"
                />

                {/* Progress circle */}
                <circle
                    cx="50"
                    cy="50"
                    r={normalizedRadius}
                    stroke={strokeColor}
                    strokeWidth={stroke}
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                />
            </svg>

            {/* Score */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-bold text-sm text-slate-900">{score}</span>
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Score</span>
            </div>
        </div>
    );
};

export default ScoreCircle;
