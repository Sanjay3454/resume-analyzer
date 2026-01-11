import { Link } from "react-router";
import ScoreCircle from "~/components/ScoreCircle";
import { useEffect, useState } from "react";
import { usePuterStore } from "~/lib/puter";

const ResumeCard = ({ resume: { id, companyName, jobTitle, feedback, imagePath } }: { resume: Resume }) => {
    const { fs } = usePuterStore();
    const [resumeUrl, setResumeUrl] = useState('');

    useEffect(() => {
        const loadResume = async () => {
            if (!imagePath) return; // Guard clause
            const blob = await fs.read(imagePath);
            if (!blob) return;
            let url = URL.createObjectURL(blob);
            setResumeUrl(url);
        }

        loadResume();
    }, [imagePath]);

    return (
        <Link
            to={`/resume/${id}`}
            className="group card hover:border-brand-300 hover:ring-1 hover:ring-brand-300 transition-all duration-200 block h-full flex flex-col"
        >
            <div className="card-header flex justify-between items-start gap-4">
                <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-semibold text-slate-900 truncate">
                        {companyName || "Untitled Application"}
                    </h2>
                    <p className="text-sm text-slate-500 truncate">
                        {jobTitle || "Resume Analysis"}
                    </p>
                </div>
                <div className="flex-shrink-0">
                    <ScoreCircle score={feedback.overallScore} />
                </div>
            </div>

            <div className="p-4 flex-1 bg-slate-50 flex items-center justify-center overflow-hidden">
                {resumeUrl ? (
                    <div className="relative w-full aspect-[3/4] shadow-sm rounded-lg overflow-hidden ring-1 ring-slate-200 bg-white">
                        <img
                            src={resumeUrl}
                            alt="resume thumbnail"
                            className="w-full h-full object-cover object-top opacity-90 group-hover:opacity-100 transition-opacity"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                ) : (
                    <div className="w-full aspect-[3/4] rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400">
                        <span className="text-sm">No Preview</span>
                    </div>
                )}
            </div>
        </Link>
    )
}
export default ResumeCard
