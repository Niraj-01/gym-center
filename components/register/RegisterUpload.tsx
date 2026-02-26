'use client';

import { useCallback, useState } from 'react';

interface RegisterUploadProps {
    onFileSelect: (file: File) => void;
    isUploading?: boolean;
}

export function RegisterUpload({ onFileSelect, isUploading }: RegisterUploadProps) {
    const [isDragging, setIsDragging] = useState(false);

    const isValidFile = (file: File): boolean => {
        const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
        const maxSize = 10 * 1024 * 1024; // 10MB

        if (!validTypes.includes(file.type)) {
            alert('Please upload a JPG, PNG, or PDF file');
            return false;
        }

        if (file.size > maxSize) {
            alert('File size exceeds 10MB limit');
            return false;
        }

        return true;
    };

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (file && isValidFile(file)) {
            onFileSelect(file);
        }
    }, [onFileSelect]);

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && isValidFile(file)) {
            onFileSelect(file);
        }
        // Reset input
        e.target.value = '';
    }, [onFileSelect]);

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
        relative border-2 border-dashed rounded-xl p-12 text-center transition
        ${isDragging
                    ? 'border-black bg-gray-50'
                    : 'border-gray-300 bg-white hover:border-gray-400'
                }
        ${isUploading ? 'opacity-50 pointer-events-none' : ''}
      `}
        >
            {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-xl z-10">
                    <div className="flex items-center gap-3">
                        <svg className="animate-spin w-6 h-6 text-black" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <span className="text-gray-700 font-medium">Uploading...</span>
                    </div>
                </div>
            )}

            {/* Icon */}
            <div className={`mx-auto w-16 h-16 rounded-xl flex items-center justify-center mb-4 ${isDragging ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'
                }`}>
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            </div>

            {/* Text */}
            <h3 className="text-lg font-medium text-gray-900 mb-1">
                {isDragging ? 'Drop your register here' : 'Upload Register Page'}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
                Drag and drop a scanned register page, or click to select
            </p>

            {/* File Input Button */}
            <label className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg font-medium cursor-pointer hover:bg-gray-900 transition">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Choose File
                <input
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isUploading}
                />
            </label>

            {/* Supported formats */}
            <p className="mt-4 text-xs text-gray-400">
                Supports: JPEG, PNG, PDF • Max size: 10MB
            </p>

            {/* Tips */}
            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Tips for best results:</h4>
                <ul className="text-xs text-blue-700 space-y-1 text-left">
                    <li className="flex items-start gap-2">
                        <span className="mt-1">•</span>
                        <span>Use good lighting when scanning - avoid shadows</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="mt-1">•</span>
                        <span>Keep the register page flat and aligned</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="mt-1">•</span>
                        <span>Higher resolution images give better results</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="mt-1">•</span>
                        <span>Ensure handwriting is clear and legible</span>
                    </li>
                </ul>
            </div>
        </div>
    );
}
