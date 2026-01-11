import { type FormEvent, useState } from 'react'
import Navbar from "~/components/Navbar";
import FileUploader from "~/components/FileUploader";
import { usePuterStore } from "~/lib/puter";
import { useNavigate } from "react-router";
import { convertPdfToImage, extractTextFromPdf } from "~/lib/pdf2img";
import { generateUUID } from "~/lib/utils";
import { prepareInstructions } from "~/constants";

const Upload = () => {
    const { auth, fs, ai, kv } = usePuterStore();
    const navigate = useNavigate();
    const [isProcessing, setIsProcessing] = useState(false);
    const [statusText, setStatusText] = useState('');
    const [file, setFile] = useState<File | null>(null);

    const handleFileSelect = (file: File | null) => {
        setFile(file)
    }

    const handleAnalyze = async ({ companyName, jobTitle, jobDescription, file }: { companyName: string, jobTitle: string, jobDescription: string, file: File }) => {
        setIsProcessing(true);

        try {
            setStatusText('Uploading the file...');
            const uploadedFile = await fs.upload([file]);
            if (!uploadedFile) throw new Error('Failed to upload file');

            setStatusText('Converting PDF to image...');
            const imageFile = await convertPdfToImage(file);
            if (imageFile.error || !imageFile.file) throw new Error(imageFile.error || 'Failed to convert PDF');

            setStatusText('Extracting text...');
            const resumeText = await extractTextFromPdf(file);
            // Non-fatal if text extraction fails, but good to warn
            if (!resumeText) console.warn("Could not extract text from PDF");

            setStatusText('Uploading preview...');
            const uploadedImage = await fs.upload([imageFile.file!]);
            if (!uploadedImage) throw new Error('Failed to upload preview image');

            setStatusText('Initializing analysis...');
            const uuid = generateUUID();
            const data = {
                id: uuid,
                resumePath: uploadedFile.path,
                imagePath: uploadedImage.path,
                companyName, jobTitle, jobDescription,
                feedback: '',
            }
            await kv.set(`resume:${uuid}`, JSON.stringify(data));

            setStatusText('Generating AI feedback...');

            const feedback = await ai.feedback(
                uploadedFile.path,
                prepareInstructions({ jobTitle, jobDescription, resumeText: resumeText || '' })
            )
            if (!feedback) throw new Error('Failed to get AI feedback');

            let feedbackText = typeof feedback.message.content === 'string'
                ? feedback.message.content
                : feedback.message.content[0].text;

            // Sanitize: Remove markdown code blocks if present
            feedbackText = feedbackText.replace(/```json\n?|```/g, '').trim();

            data.feedback = JSON.parse(feedbackText);
            await kv.set(`resume:${uuid}`, JSON.stringify(data));

            setStatusText('Finalizing...');
            navigate(`/resume/${uuid}`);
        } catch (error) {
            console.error(error);
            setStatusText(error instanceof Error ? error.message : "An unexpected error occurred");
            // Optionally set an error state to show to user, but for now we'll just stop spinner
            // Wait a bit so user can read error?
        }
    }

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget.closest('form');
        if (!form) return;
        const formData = new FormData(form);

        const companyName = formData.get('company-name') as string;
        const jobTitle = formData.get('job-title') as string;
        const jobDescription = formData.get('job-description') as string;

        if (!file) return;

        handleAnalyze({ companyName, jobTitle, jobDescription, file });
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Navbar />

            <main className="flex-1 container-main py-12">
                <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-10">
                        <h1 className="mb-2">New Analysis</h1>
                        <p className="text-lg text-slate-600">
                            Upload your resume to get detailed feedback tailored to the job description.
                        </p>
                    </div>

                    {isProcessing ? (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                            <div className="flex justify-center mb-6">
                                <div className="relative">
                                    <div className="w-24 h-24 rounded-full border-4 border-slate-100"></div>
                                    <div className="w-24 h-24 rounded-full border-4 border-brand-600 border-t-transparent animate-spin absolute inset-0"></div>
                                </div>
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">Analyzing Resume</h2>
                            <p className="text-slate-500 animate-pulse">{statusText}</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                            <form id="upload-form" onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label htmlFor="company-name" className="label-text">Company Name <span className="text-slate-400 font-normal">(Optional)</span></label>
                                    <input type="text" name="company-name" placeholder="e.g. Acme Corp" id="company-name" className="input-field" />
                                </div>

                                <div>
                                    <label htmlFor="job-title" className="label-text">Job Title <span className="text-slate-400 font-normal">(Optional)</span></label>
                                    <input type="text" name="job-title" placeholder="e.g. Senior Frontend Engineer" id="job-title" className="input-field" />
                                </div>

                                <div>
                                    <label htmlFor="job-description" className="label-text">Job Description <span className="text-slate-400 font-normal">(Optional)</span></label>
                                    <textarea
                                        rows={6}
                                        name="job-description"
                                        placeholder="Paste the job description here..."
                                        id="job-description"
                                        className="input-field resize-y"
                                    />
                                    <p className="text-xs text-slate-500 mt-1">Include key requirements and skills for best results.</p>
                                </div>

                                <div className="pt-2">
                                    <label className="label-text mb-2 block">Resume PDF</label>
                                    <FileUploader onFileSelect={handleFileSelect} />
                                </div>

                                <div className="pt-4">
                                    <button
                                        className="btn btn-primary w-full btn-large shadow-brand-200 shadow-lg hover:shadow-xl transition-all"
                                        type="submit"
                                        disabled={!file}
                                    >
                                        Start Analysis
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
export default Upload
