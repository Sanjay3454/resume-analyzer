import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { formatSize } from '../lib/utils';

interface FileUploaderProps {
    onFileSelect?: (file: File | null) => void;
}

const FileUploader = ({ onFileSelect }: FileUploaderProps) => {
    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0] || null;
        onFileSelect?.(file);
    }, [onFileSelect]);

    const maxFileSize = 20 * 1024 * 1024; // 20MB in bytes

    const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
        onDrop,
        multiple: false,
        accept: { 'application/pdf': ['.pdf'] },
        maxSize: maxFileSize,
    });

    const file = acceptedFiles[0] || null;

    return (
        <div className="w-full">
            <div
                {...getRootProps()}
                className={`
                    relative group cursor-pointer transition-all duration-200 ease-in-out
                    border-2 border-dashed rounded-xl p-12 text-center
                    flex flex-col items-center justify-center gap-4
                    ${isDragActive
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-slate-300 bg-white hover:border-brand-500 hover:bg-slate-50'
                    }
                `}
            >
                <input {...getInputProps()} />

                {file ? (
                    <div className="w-full max-w-md mx-auto bg-slate-100 rounded-lg p-4 flex items-center justify-between group-hover:bg-white transition-colors border border-transparent group-hover:border-slate-200 shadow-sm" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="p-2 bg-rose-100 rounded-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-rose-500">
                                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                                    <polyline points="14 2 14 8 20 8" />
                                </svg>
                            </div>
                            <div className="text-left min-w-0">
                                <p className="text-sm font-medium text-slate-900 truncate">
                                    {file.name}
                                </p>
                                <p className="text-xs text-slate-500">
                                    {formatSize(file.size)}
                                </p>
                            </div>
                        </div>
                        <button
                            className="p-1.5 hover:bg-slate-200 rounded-full text-slate-500 hover:text-rose-500 transition-colors"
                            onClick={(e) => {
                                e.stopPropagation();
                                onFileSelect?.(null);
                            }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="p-4 rounded-full bg-brand-50 text-brand-600 group-hover:bg-brand-100 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="17 8 12 3 7 8"></polyline>
                                <line x1="12" y1="3" x2="12" y2="15"></line>
                            </svg>
                        </div>
                        <div className="space-y-1">
                            <p className="text-lg font-medium text-slate-900">
                                Click to upload or drag and drop
                            </p>
                            <p className="text-sm text-slate-500">
                                PDF up to {formatSize(maxFileSize)}
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default FileUploader;
