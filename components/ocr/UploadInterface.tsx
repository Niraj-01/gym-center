'use client';

import { useCallback, useState } from 'react';

interface UploadInterfaceProps {
    onFileSelect: (file: File) => void;
}

export function UploadInterface({ onFileSelect }: UploadInterfaceProps) {
    const [isDragging, setIsDragging] = useState(false);

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
        if (file && file.type.startsWith('image/')) {
            onFileSelect(file);
        }
    }, [onFileSelect]);

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onFileSelect(file);
        }
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
      `}
        >
            {/* Icon */}
            <div className={`mx-auto w-14 h-14 rounded-xl flex items-center justify-center mb-4 ${isDragging ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'
                }`}>
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            </div>

            {/* Text */}
            <h3 className="text-base font-medium text-gray-900 mb-1">
                {isDragging ? 'Drop your document here' : 'Upload a document'}
            </h3>
            <p className="text-sm text-gray-500 mb-5">
                Drag and drop an image file, or click to select
            </p>

            {/* File Input Button */}
            <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-lg font-medium cursor-pointer hover:bg-gray-900 transition text-sm">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Choose Image
                <input
                    type="file"
                    accept="image/jpeg,image/png,image/jpg"
                    onChange={handleFileChange}
                    className="hidden"
                />
            </label>

            {/* Supported formats */}
            <p className="mt-4 text-xs text-gray-400">
                Supports: JPEG, PNG • Max size: 10MB
            </p>

            {/* Document type hints */}
            <div className="mt-6 flex items-center justify-center gap-5 text-xs text-gray-500">
                <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded bg-orange-100 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-orange-600">आ</span>
                    </div>
                    <span>Aadhaar</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-blue-600">PAN</span>
                    </div>
                    <span>PAN Card</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center">
                        <svg className="w-3 h-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <span>Forms</span>
                </div>
            </div>
        </div>
    );
}
