'use client';

/**
 * QR Code Generation Page - Admin only
 * Generate QR code for gym entrance that redirects members to login
 */

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { QRCodeCanvas } from 'qrcode.react';
import { GYM_NAME } from '@/lib/config';

function QRCodeContent() {
    const router = useRouter();
    const qrRef = useRef<HTMLDivElement>(null);
    const [qrSize, setQRSize] = useState(300);

    // Get member login URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const memberLoginUrl = `${appUrl}/member/login?source=qr`;

    const downloadQRCode = () => {
        const canvas = qrRef.current?.querySelector('canvas');
        if (!canvas) return;

        // Convert canvas to blob and download
        canvas.toBlob((blob) => {
            if (!blob) return;

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${GYM_NAME.replace(/\s+/g, '-')}-Member-Login-QR.png`;
            link.click();
            URL.revokeObjectURL(url);
        });
    };

    const printQRCode = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors mb-4"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span className="text-sm">Back to Dashboard</span>
                    </button>
                    <h1 className="text-2xl font-bold text-black">Member Login QR Code</h1>
                    <p className="text-gray-600 text-sm mt-1">Generate QR code for gym entrance</p>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
                <div className="grid md:grid-cols-2 gap-8">
                    {/* QR Code Display */}
                    <div className="space-y-6">
                        <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 text-center print:border-none">
                            <h2 className="text-lg font-semibold text-gray-900 mb-6">{GYM_NAME}</h2>

                            {/* QR Code */}
                            <div ref={qrRef} className="flex justify-center mb-6">
                                <QRCodeCanvas
                                    value={memberLoginUrl}
                                    size={qrSize}
                                    level="H"
                                    includeMargin={true}
                                />
                            </div>

                            <div className="space-y-2">
                                <p className="text-sm font-medium text-gray-900">Scan to Access Member Portal</p>
                                <p className="text-xs text-gray-500 break-all">{memberLoginUrl}</p>
                            </div>
                        </div>

                        {/* QR Size Control */}
                        <div className="print:hidden">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                QR Code Size: {qrSize}px
                            </label>
                            <input
                                type="range"
                                min="200"
                                max="500"
                                step="50"
                                value={qrSize}
                                onChange={(e) => setQRSize(parseInt(e.target.value))}
                                className="w-full"
                            />
                        </div>
                    </div>

                    {/* Instructions & Actions */}
                    <div className="space-y-6 print:hidden">
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-blue-900 mb-4">How to Use</h3>
                            <ol className="space-y-3 text-sm text-blue-800">
                                <li className="flex gap-3">
                                    <span className="font-bold">1.</span>
                                    <span>Download or print the QR code</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="font-bold">2.</span>
                                    <span>Place it at the gym entrance or reception</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="font-bold">3.</span>
                                    <span>Members scan with their phone camera</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="font-bold">4.</span>
                                    <span>They'll be redirected to member login page</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="font-bold">5.</span>
                                    <span>Members enter their phone number to login</span>
                                </li>
                            </ol>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-3">
                            <button
                                onClick={downloadQRCode}
                                className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Download QR Code
                            </button>

                            <button
                                onClick={printQRCode}
                                className="w-full py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                </svg>
                                Print QR Code
                            </button>
                        </div>

                        {/* Manual URL */}
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">Manual Access URL:</p>
                            <div className="bg-white border border-gray-300 rounded-lg p-3">
                                <p className="text-xs font-mono break-all text-gray-600">{memberLoginUrl}</p>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                Members can also type this URL directly in their browser
                            </p>
                        </div>

                        {/* Important Note */}
                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                            <h4 className="text-sm font-semibold text-yellow-900 mb-2">⚠️ Important</h4>
                            <p className="text-xs text-yellow-800">
                                Only registered members (those added to your members database) can login using this QR code.
                                Make sure to add members through the admin panel first.
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .print\\:border-none,
                    .print\\:border-none * {
                        visibility: visible;
                    }
                    .print\\:border-none {
                        position: absolute;
                        left: 50%;
                        top: 50%;
                        transform: translate(-50%, -50%);
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
}

export default function QRCodePage() {
    return (
        <AuthGuard>
            <QRCodeContent />
        </AuthGuard>
    );
}
