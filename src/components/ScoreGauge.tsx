import { useEffect, useRef, useState } from "react";

const ScoreGauge = ({ score = 75 }: { score: number }) => {
    const [pathLength, setPathLength] = useState(0);
    const pathRef = useRef<SVGPathElement>(null);

    const percentage = score / 100;

    useEffect(() => {
        if (pathRef.current) {
            setPathLength(pathRef.current.getTotalLength());
        }
    }, []);

    // Determine color based on score
    let startColor = "#ef4444"; // red
    let endColor = "#fca5a5";

    if (score > 69) {
        startColor = "#10b981"; // emerald
        endColor = "#34d399";
    } else if (score > 49) {
        startColor = "#f59e0b"; // amber
        endColor = "#fbbf24";
    }

    return (
        <div className="flex flex-col items-center">
            <div className="relative w-40 h-20 overflow-hidden">
                <svg viewBox="0 0 100 50" className="w-full h-full text-slate-200">
                    <defs>
                        <linearGradient
                            id="gaugeGradient"
                            x1="0%"
                            y1="0%"
                            x2="100%"
                            y2="0%"
                        >
                            <stop offset="0%" stopColor={startColor} />
                            <stop offset="100%" stopColor={endColor} />
                        </linearGradient>
                    </defs>

                    {/* Background arc */}
                    <path
                        d="M10,50 A40,40 0 0,1 90,50"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="10"
                        strokeLinecap="round"
                    />

                    {/* Foreground arc with rounded ends */}
                    <path
                        ref={pathRef}
                        d="M10,50 A40,40 0 0,1 90,50"
                        fill="none"
                        stroke="url(#gaugeGradient)"
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={pathLength}
                        strokeDashoffset={pathLength * (1 - percentage)}
                        className="transition-all duration-1000 ease-out"
                    />
                </svg>

                <div className="absolute inset-x-0 bottom-0 flex flex-col items-center justify-end">
                    <div className="text-3xl font-bold text-slate-900 leading-none">{score}</div>
                </div>
            </div>
        </div>
    );
};

export default ScoreGauge;
