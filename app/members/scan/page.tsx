'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { QuotaDisplay } from '@/components/ocr/QuotaDisplay';
import { UploadInterface } from '@/components/ocr/UploadInterface';
import { DocumentPreview } from '@/components/ocr/DocumentPreview';
import { ExtractedDataForm } from '@/components/ocr/ExtractedDataForm';
import { getOCRUsage, scanDocument, saveMemberFromOCR, OCRQuotaInfo, OCRScanResult } from '@/app/actions/ocr';
import { getPlans } from '@/app/actions/plans';

type Plan = {
    id: number;
    name: string;
    duration_days: number;
    price: number;
};

function ScanMemberContent() {
    const { user } = useAuth();

    // State
    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const [scanResult, setScanResult] = useState<OCRScanResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [usage, setUsage] = useState<OCRQuotaInfo | null>(null);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Editable form data
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        gender: '',
        planId: '',
        startDate: new Date().toISOString().split('T')[0],
    });

    // Load plans on mount
    useEffect(() => {
        async function loadPlans() {
            const { data: plansData, error } = await getPlans();
            console.log('[OCR] Plans loaded:', plansData, 'Error:', error);
            if (plansData && plansData.length > 0) {
                setPlans(plansData);
                setFormData(prev => ({ ...prev, planId: String(plansData[0].id) }));
            }
        }
        loadPlans();
    }, []);

    // Load usage on user change
    useEffect(() => {
        async function loadUsage() {
            if (user?.email) {
                const quotaData = await getOCRUsage(user.email);
                setUsage(quotaData);
            }
        }
        loadUsage();
    }, [user]);

    // Handle file selection
    const handleFileSelect = useCallback((file: File) => {
        setImage(file);
        setImagePreview(URL.createObjectURL(file));
        setError(null);
        setScanResult(null);
        setSaveSuccess(false);
    }, []);

    // Handle scan
    const handleScan = async () => {
        if (!image || !user?.email) return;

        setProcessing(true);
        setError(null);

        try {
            const formDataObj = new FormData();
            formDataObj.append('document', image);

            const result = await scanDocument(formDataObj, user.email);

            if (result.success && result.data) {
                setScanResult(result);

                // Populate form with extracted data
                setFormData(prev => ({
                    ...prev,
                    name: result.data?.name || '',
                    phone: result.data?.phone?.replace('+91 ', '') || '',
                    email: result.data?.email || '',
                    gender: result.data?.gender || '',
                }));

                // Refresh usage
                const quotaData = await getOCRUsage(user.email);
                setUsage(quotaData);
            } else {
                setError(result.message || 'Failed to process document');
            }
        } catch (err) {
            setError('An error occurred while processing the document');
            console.error(err);
        } finally {
            setProcessing(false);
        }
    };

    // Handle form field change
    const handleFieldChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Calculate expiry date
    const calculateExpiryDate = (): string => {
        const selectedPlan = plans.find(p => p.id === Number(formData.planId));
        if (!selectedPlan) return '';

        const startDate = new Date(formData.startDate);
        const expiryDate = new Date(startDate);
        expiryDate.setDate(expiryDate.getDate() + selectedPlan.duration_days);
        return expiryDate.toISOString().split('T')[0];
    };

    // Handle save member
    const handleSave = async () => {
        if (!user?.email || !formData.name || !formData.phone) {
            setError('Name and Phone are required');
            return;
        }

        if (!formData.planId) {
            setError('Please select a membership plan');
            return;
        }

        const expiryDate = calculateExpiryDate();
        if (!expiryDate) {
            setError('Please select a valid membership plan');
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const result = await saveMemberFromOCR(
                {
                    name: formData.name,
                    phone: formData.phone.startsWith('+91') ? formData.phone : `+91 ${formData.phone}`,
                    email: formData.email || null,
                    gender: formData.gender || null,
                    planId: Number(formData.planId),
                    startDate: formData.startDate,
                    expiryDate: expiryDate,
                    overallConfidence: scanResult?.metadata?.overallConfidence,
                },
                user.email
            );

            if (result.success) {
                setSaveSuccess(true);
                setTimeout(() => {
                    resetScanner();
                }, 2000);
            } else {
                setError(result.error || 'Failed to save member');
            }
        } catch (err) {
            setError('An error occurred while saving');
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    // Reset scanner
    const resetScanner = () => {
        setImage(null);
        setImagePreview(null);
        setScanResult(null);
        setError(null);
        setSaveSuccess(false);
        setFormData({
            name: '',
            phone: '',
            email: '',
            gender: '',
            planId: plans.length > 0 ? String(plans[0].id) : '',
            startDate: new Date().toISOString().split('T')[0],
        });
    };

    return (
        <AdminLayout>
            <div className="px-3 sm:p-6 py-4 max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold text-gray-900">
                        Scan Member Document
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Upload an Aadhaar card, PAN card, or form to automatically extract member details
                    </p>
                </div>

                {/* Quota Display */}
                {usage && (
                    <QuotaDisplay
                        used={usage.used}
                        limit={usage.limit}
                        tier={usage.tier.charAt(0).toUpperCase() + usage.tier.slice(1)}
                    />
                )}

                {/* Error Alert */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center gap-3">
                            <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    </div>
                )}

                {/* Success Alert */}
                {saveSuccess && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-3">
                            <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm text-green-700">Member saved successfully!</p>
                        </div>
                    </div>
                )}

                {/* Main Content */}
                {!imagePreview ? (
                    /* Upload Interface */
                    <UploadInterface onFileSelect={handleFileSelect} />
                ) : (
                    /* Two Column Layout: Document Preview + Form */
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        {/* Left: Document Preview (40% = 2/5) */}
                        <div className="lg:col-span-2">
                            <DocumentPreview
                                image={imagePreview}
                                onScan={!scanResult ? handleScan : undefined}
                                isProcessing={processing}
                            />
                        </div>

                        {/* Right: Extracted Data Form (60% = 3/5) */}
                        <div className="lg:col-span-3">
                            {scanResult?.success ? (
                                <ExtractedDataForm
                                    formData={formData}
                                    confidence={scanResult.data?.confidence}
                                    plans={plans}
                                    expiryDate={calculateExpiryDate()}
                                    onFieldChange={handleFieldChange}
                                    onSave={handleSave}
                                    onCancel={resetScanner}
                                    saving={saving}
                                />
                            ) : (
                                <div className="bg-white border border-gray-200 rounded-xl p-6 h-full flex items-center justify-center">
                                    <div className="text-center text-gray-500">
                                        <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <p className="text-sm">Click &quot;Scan Document&quot; to extract data</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Start Over Link */}
                {imagePreview && (
                    <div className="mt-6">
                        <button
                            onClick={resetScanner}
                            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M1 4v6h6M23 20v-6h-6" />
                                <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" />
                            </svg>
                            Start Over
                        </button>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}

export default function ScanMemberPage() {
    return (
        <AuthGuard>
            <ScanMemberContent />
        </AuthGuard>
    );
}
