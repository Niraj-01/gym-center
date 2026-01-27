/**
 * ProcessingIndicator Component
 * 
 * Displays a processing animation while AI is analyzing the document.
 * Optionally shows a preview of the uploaded document.
 */

interface ProcessingIndicatorProps {
    /** Preview URL of the uploaded document */
    previewUrl?: string | null;
}

export function ProcessingIndicator({ previewUrl }: ProcessingIndicatorProps) {
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            {/* Spinner with AI Icon */}
            <div className="relative mx-auto w-20 h-20 mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
                <div className="absolute inset-0 rounded-full border-4 border-t-violet-600 animate-spin" />
                <div className="absolute inset-4 rounded-full bg-gradient-to-br from-violet-50 to-blue-50 flex items-center justify-center">
                    <svg className="w-8 h-8 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
                    </svg>
                </div>
            </div>

            {/* Status Text */}
            <h3 className="text-lg font-medium text-gray-900 mb-2">AI is Reading Your Document</h3>
            <p className="text-sm text-gray-500 mb-1">Analyzing handwriting and extracting information...</p>
            <p className="text-xs text-gray-400">This may take a few seconds</p>

            {/* Document Preview (if available) */}
            {previewUrl && (
                <div className="mt-6 inline-block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={previewUrl}
                        alt="Uploaded document"
                        className="max-h-32 rounded-lg border border-gray-200 opacity-50"
                    />
                </div>
            )}
        </div>
    );
}

