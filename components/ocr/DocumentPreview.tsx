'use client';

interface DocumentPreviewProps {
    image: string | null;
    onScan?: () => void;
    isProcessing?: boolean;
}

export function DocumentPreview({ image, onScan, isProcessing }: DocumentPreviewProps) {
    return (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 h-full">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Document Preview</h3>

            <div className="bg-white rounded-lg overflow-hidden border border-gray-100 aspect-[4/3] flex items-center justify-center">
                {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={image}
                        alt="Scanned document"
                        className="w-full h-full object-contain"
                    />
                ) : (
                    <div className="text-center text-gray-400 p-8">
                        <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm">No document uploaded</p>
                    </div>
                )}
            </div>

            {/* Scan Button */}
            {image && onScan && (
                <button
                    onClick={onScan}
                    disabled={isProcessing}
                    className="w-full mt-4 py-3 px-4 bg-black text-white rounded-lg font-medium hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition"
                >
                    {isProcessing ? (
                        <>
                            <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Processing...
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            Scan Document
                        </>
                    )}
                </button>
            )}
        </div>
    );
}
