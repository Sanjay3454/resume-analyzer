import ScoreGauge from "~/components/ScoreGauge";
import ScoreBadge from "~/components/ScoreBadge";

const Category = ({ title, score }: { title: string, score: number }) => {
    return (
        <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
            <div className="flex items-center gap-3">
                <span className="font-medium text-slate-700">{title}</span>
                <ScoreBadge score={score} />
            </div>
            <div className="text-sm font-semibold text-slate-900">
                {score}/100
            </div>
        </div>
    )
}

const Summary = ({ feedback }: { feedback: Feedback }) => {
    return (
        <div className="card p-6">
            <div className="flex flex-col md:flex-row items-center gap-6 mb-6">
                <ScoreGauge score={feedback.overallScore} />
                <div className="text-center md:text-left">
                    <h2 className="text-xl font-bold text-slate-900">Overall Score</h2>
                    <p className="text-sm text-slate-500">
                        Based on industry standards and job description relevance.
                    </p>
                </div>
            </div>

            <div className="space-y-1">
                <Category title="Tone & Style" score={feedback.toneAndStyle.score} />
                <Category title="Content" score={feedback.content.score} />
                <Category title="Structure" score={feedback.structure.score} />
                <Category title="Skills" score={feedback.skills.score} />
            </div>
        </div>
    )
}
export default Summary
