import type { Route } from "./+types/home";
import Navbar from "~/components/Navbar";
import ResumeCard from "~/components/ResumeCard";
import { usePuterStore } from "~/lib/puter";
import { Link, useNavigate } from "react-router";
import { useEffect, useState } from "react";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Resumind" },
    { name: "description", content: "Smart feedback for your dream job!" },
  ];
}

export default function Home() {
  const { auth, kv } = usePuterStore();
  const navigate = useNavigate();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loadingResumes, setLoadingResumes] = useState(false);

  useEffect(() => {
    if (!auth.isAuthenticated) navigate('/auth?next=/');
  }, [auth.isAuthenticated, navigate]);

  useEffect(() => {
    const loadResumes = async () => {
      setLoadingResumes(true);
      try {
        const resumes = (await kv.list('resume:*', true)) as KVItem[];
        const parsedResumes = resumes?.map((resume) => (
          JSON.parse(resume.value) as Resume
        )) || [];
        // Sort by recency if possible? KV list order is not guaranteed but usually alphabetical by key. 
        // Assuming keys are UUIDs, random order. We could sort if we had timestamps.
        setResumes(parsedResumes);
      } catch (err) {
        console.error("Failed to load resumes", err);
      } finally {
        setLoadingResumes(false);
      }
    }

    loadResumes()
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 container-main w-full">
        <div className="py-12 text-center max-w-3xl mx-auto mb-12">
          <h1 className="mb-4">
            Track your applications & ratings
          </h1>
          <p className="text-xl text-slate-600">
            {!loadingResumes && resumes.length === 0
              ? "Upload your first resume to get AI-powered feedback."
              : "Review your submissions and improve your score."}
          </p>
        </div>

        {loadingResumes ? (
          <div className="flex flex-col items-center justify-center py-20">
            <svg className="animate-spin h-10 w-10 text-brand-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-slate-500">Loading your resumes...</p>
          </div>
        ) : (
          <>
            {resumes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {resumes.map((resume) => (
                  <ResumeCard key={resume.id} resume={resume} />
                ))}

                {/* Upload new card */}
                <Link
                  to="/upload"
                  className="group border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center p-8 hover:border-brand-500 hover:bg-brand-50 transition-all cursor-pointer min-h-[300px]"
                >
                  <div className="bg-slate-100 p-4 rounded-full group-hover:bg-brand-100 transition-colors mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-400 group-hover:text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <span className="font-medium text-slate-900 group-hover:text-brand-700">Analyze New Resume</span>
                </Link>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center mt-10 gap-6">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center max-w-lg">
                  <div className="bg-brand-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="mb-2">No resumes yet</h3>
                  <p className="text-slate-500 mb-8">
                    Upload your resume to get instant feedback on your ATS score, formatting, and content.
                  </p>
                  <Link to="/upload" className="btn btn-primary btn-large w-full">
                    Upload Resume
                  </Link>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
