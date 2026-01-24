'use client';

/**
 * Unified Member Registration - OCR-Driven Workflow
 * 
 * Primary flow: Upload document → OCR extraction → Auto-populate form → Review → Submit
 * Fallback: Manual entry option available
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { QuotaDisplay } from '@/components/ocr/QuotaDisplay';
import { ConfidenceBadge } from '@/components/ocr/ConfidenceBadge';
import { getOCRUsage, scanDocument, saveMemberFromOCR, OCRQuotaInfo, OCRScanResult } from '@/app/actions/ocr';
import { getPlans } from '@/app/actions/plans';

type Plan = {
    id: number;
    name: string;
    duration_days: number;
    price: number;
};

type WorkflowStep = 'upload' | 'processing' | 'review' | 'success';

interface FormData {
    name: string;
    phone: string;
    email: string;
    gender: string;
    planId: string;
    startDate: string;
    aadhaar: string;
    pan: string;
    address: string;
    dateOfBirth: string;
    notes: string;
}

interface FieldConfidence {
    name: number;
    phone: number;
    email: number;
    gender: number;
    aadhaar: number;
    pan: number;
    address: number;
    dateOfBirth: number;
}

// Helper component for confidence indicator
function ConfidenceIndicator({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' }) {
    const percent = Math.round(score * 100);
    const isLow = score < 0.85;
    const sizeClasses = size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-sm px-2 py-1';

    return (
        <span className={`${sizeClasses} font-medium rounded ${isLow ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
            }`}>
            {percent}%
        </span>
    );
}

function AddMemberNewContent() {
    const router = useRouter();
    const { user } = useAuth();

    // Workflow state
    const [step, setStep] = useState<WorkflowStep>('upload');
    const [showManualEntry, setShowManualEntry] = useState(false);

    // File state
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    // OCR state
    const [processing, setProcessing] = useState(false);
    const [scanResult, setScanResult] = useState<OCRScanResult | null>(null);
    const [usage, setUsage] = useState<OCRQuotaInfo | null>(null);
    const [confidence, setConfidence] = useState<FieldConfidence>({
        name: 0,
        phone: 0,
        email: 0,
        gender: 0,
        aadhaar: 0,
        pan: 0,
        address: 0,
        dateOfBirth: 0,
    });

    // Form state
    const [formData, setFormData] = useState<FormData>({
        name: '',
        phone: '',
        email: '',
        gender: '',
        planId: '',
        startDate: new Date().toISOString().split('T')[0],
        aadhaar: '',
        pan: '',
        address: '',
        dateOfBirth: '',
        notes: '',
    });

    const [plans, setPlans] = useState<Plan[]>([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [documentType, setDocumentType] = useState<'aadhaar' | 'pan' | 'form' | null>(null);

    // Load plans on mount
    useEffect(() => {
        async function loadPlans() {
            const { data: plansData } = await getPlans();
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
    const handleFileSelect = useCallback(async (file: File) => {
        // Validate file
        const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (!validTypes.includes(file.type)) {
            setError('Please upload a JPEG or PNG image');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setError('File size must be less than 10MB');
            return;
        }

        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        setError(null);

        // Auto-trigger OCR
        await processDocument(file);
    }, [user]);

    // Process document with OCR
    const processDocument = async (file: File) => {
        if (!user?.email) {
            setError('Please log in to scan documents');
            return;
        }

        setStep('processing');
        setProcessing(true);
        setError(null);

        try {
            const formDataObj = new FormData();
            formDataObj.append('document', file);

            const result = await scanDocument(formDataObj, user.email);

            if (result.success && result.data) {
                setScanResult(result);

                // Detect document type based on extracted data
                const detectedType = detectDocumentType(result.data);
                setDocumentType(detectedType);

                // Map extracted data to form fields (using aadhaar/pan from ExtractedMemberData)
                setFormData(prev => ({
                    ...prev,
                    name: result.data?.name || prev.name,
                    phone: result.data?.phone?.replace('+91 ', '').replace('+91', '') || prev.phone,
                    email: result.data?.email || prev.email,
                    gender: result.data?.gender || prev.gender,
                    aadhaar: result.data?.aadhaar || prev.aadhaar,
                    pan: result.data?.pan || prev.pan,
                    address: result.data?.address || prev.address,
                    dateOfBirth: result.data?.dateOfBirth || prev.dateOfBirth,
                }));

                // Set confidence scores
                if (result.data?.confidence) {
                    setConfidence({
                        name: result.data.confidence.name || 0,
                        phone: result.data.confidence.phone || 0,
                        email: result.data.confidence.email || 0,
                        gender: result.data.confidence.gender || 0,
                        aadhaar: result.data.confidence.aadhaar || 0,
                        pan: result.data.confidence.pan || 0,
                        address: result.data.confidence.address || 0,
                        dateOfBirth: result.data.confidence.dateOfBirth || 0,
                    });
                }

                // Refresh usage
                const quotaData = await getOCRUsage(user.email);
                setUsage(quotaData);

                setStep('review');
            } else {
                setError(result.message || 'Failed to process document. You can enter details manually.');
                setStep('review');
                setShowManualEntry(true);
            }
        } catch (err) {
            console.error('[OCR Error]', err);
            setError('OCR processing failed. Please enter details manually.');
            setStep('review');
            setShowManualEntry(true);
        } finally {
            setProcessing(false);
        }
    };

    // Detect document type
    const detectDocumentType = (data: { aadhaar?: string | null; pan?: string | null; name?: string | null; documentType?: string }): 'aadhaar' | 'pan' | 'form' | null => {
        if (data?.aadhaar || data?.documentType === 'aadhaar') return 'aadhaar';
        if (data?.pan || data?.documentType === 'pan') return 'pan';
        if (data?.name) return 'form';
        return null;
    };

    // Handle form field change
    const handleFieldChange = (field: keyof FormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Validate form
    const validateForm = (): string[] => {
        const errors: string[] = [];
        if (!formData.name.trim()) errors.push('Name is required');
        if (!formData.phone.trim()) errors.push('Phone number is required');
        if (formData.phone && !/^[6-9]\d{9}$/.test(formData.phone.replace(/\D/g, ''))) {
            errors.push('Please enter a valid 10-digit phone number');
        }
        if (!formData.planId) errors.push('Please select a membership plan');
        if (formData.aadhaar && !/^\d{12}$/.test(formData.aadhaar.replace(/\s/g, ''))) {
            errors.push('Invalid Aadhaar number format (12 digits required)');
        }
        if (formData.pan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan.toUpperCase())) {
            errors.push('Invalid PAN format (e.g., ABCDE1234F)');
        }
        return errors;
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

    // Handle save
    const handleSave = async () => {
        const validationErrors = validateForm();
        if (validationErrors.length > 0) {
            setError(validationErrors.join('. '));
            return;
        }

        if (!user?.email) {
            setError('Please log in to save');
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
                    // Extended fields
                    aadhaarNumber: formData.aadhaar || null,
                    panNumber: formData.pan?.toUpperCase() || null,
                    address: formData.address || null,
                    dateOfBirth: formData.dateOfBirth || null,
                    notes: formData.notes || null,
                },
                user.email
            );

            if (result.success) {
                setStep('success');
            } else {
                setError(result.error || 'Failed to save member');
            }
        } catch (err) {
            console.error('[Save Error]', err);
            setError('An error occurred while saving');
        } finally {
            setSaving(false);
        }
    };

    // Reset workflow
    const resetWorkflow = () => {
        setStep('upload');
        setSelectedFile(null);
        setPreviewUrl(null);
        setScanResult(null);
        setError(null);
        setShowManualEntry(false);
        setDocumentType(null);
        setFormData({
            name: '',
            phone: '',
            email: '',
            gender: '',
            planId: plans.length > 0 ? String(plans[0].id) : '',
            startDate: new Date().toISOString().split('T')[0],
            aadhaar: '',
            pan: '',
            address: '',
            dateOfBirth: '',
            notes: '',
        });
        setConfidence({
            name: 0, phone: 0, email: 0, gender: 0,
            aadhaar: 0, pan: 0, address: 0, dateOfBirth: 0,
        });
    };

    // Drag handlers
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFileSelect(file);
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFileSelect(file);
        e.target.value = '';
    };

    // Get confidence color/style
    const getConfidenceStyle = (value: number) => {
        if (value >= 0.85) return { bg: 'bg-green-50', border: 'border-green-200' };
        if (value >= 0.6) return { bg: 'bg-yellow-50', border: 'border-yellow-300' };
        return { bg: 'bg-white', border: 'border-gray-200' };
    };

    return (
        <AdminLayout>
            <div className="px-3 sm:p-6 py-4 max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold text-gray-900">Add New Member</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Upload an Aadhaar card, PAN card, or registration form to get started
                    </p>
                </div>

                {/* Quota Display */}
                {usage && step === 'upload' && (
                    <QuotaDisplay
                        used={usage.used}
                        limit={usage.limit}
                        tier={usage.tier.charAt(0).toUpperCase() + usage.tier.slice(1)}
                    />
                )}

                {/* Error Alert */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <p className="text-sm text-red-700">{error}</p>
                                {step === 'review' && !showManualEntry && (
                                    <button
                                        onClick={() => setShowManualEntry(true)}
                                        className="text-sm text-red-600 underline mt-1 hover:text-red-800"
                                    >
                                        Enter details manually
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Step: Upload */}
                {step === 'upload' && (
                    <div className="space-y-6">
                        {/* Upload Area */}
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`
                relative border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer
                ${isDragging
                                    ? 'border-black bg-gray-50 scale-[1.02]'
                                    : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50'
                                }
              `}
                            onClick={() => document.getElementById('file-input')?.click()}
                        >
                            <input
                                type="file"
                                id="file-input"
                                accept="image/jpeg,image/png,image/jpg"
                                onChange={handleFileInputChange}
                                className="hidden"
                            />

                            <div className={`mx-auto w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-colors ${isDragging ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'
                                }`}>
                                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>

                            <h3 className="text-xl font-medium text-gray-900 mb-2">
                                {isDragging ? 'Drop your document' : 'Upload ID Document'}
                            </h3>
                            <p className="text-gray-500 mb-6">
                                Drag and drop or click to select an Aadhaar card, PAN card, or registration form
                            </p>

                            <div className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-900 transition">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                                Select Document
                            </div>

                            <p className="mt-4 text-xs text-gray-400">
                                Supports: JPEG, PNG • Max size: 10MB
                            </p>
                        </div>

                        {/* Document Type Examples */}
                        <div className="grid grid-cols-3 gap-4">
                            {[
                                { icon: '🪪', label: 'Aadhaar Card', desc: 'Auto-extract name, DOB, address' },
                                { icon: '💳', label: 'PAN Card', desc: 'Auto-extract name, PAN number' },
                                { icon: '📋', label: 'Registration Form', desc: 'Auto-extract all fields' },
                            ].map((docType) => (
                                <div key={docType.label} className="p-4 bg-gray-50 rounded-lg text-center">
                                    <span className="text-2xl">{docType.icon}</span>
                                    <p className="text-sm font-medium text-gray-900 mt-2">{docType.label}</p>
                                    <p className="text-xs text-gray-500 mt-1">{docType.desc}</p>
                                </div>
                            ))}
                        </div>

                        {/* Manual Entry Option */}
                        <div className="text-center pt-4 border-t border-gray-200">
                            <button
                                onClick={() => {
                                    setShowManualEntry(true);
                                    setStep('review');
                                }}
                                className="text-sm text-gray-600 hover:text-gray-900 transition"
                            >
                                Or enter details manually without scanning →
                            </button>
                        </div>
                    </div>
                )}

                {/* Step: Processing */}
                {step === 'processing' && (
                    <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
                        <div className="relative mx-auto w-20 h-20 mb-6">
                            <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
                            <div className="absolute inset-0 rounded-full border-4 border-t-black animate-spin" />
                            <div className="absolute inset-4 rounded-full bg-gray-50 flex items-center justify-center">
                                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            </div>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Processing Document</h3>
                        <p className="text-sm text-gray-500">Extracting information from your document...</p>

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
                )}

                {/* Step: Review */}
                {step === 'review' && (
                    <div className="space-y-6">
                        {/* Document Preview + Form */}
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                            {/* Left: Document Preview (2/5) */}
                            {previewUrl && (
                                <div className="lg:col-span-2">
                                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden sticky top-4">
                                        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">
                                                    {documentType === 'aadhaar' ? '🪪' : documentType === 'pan' ? '💳' : '📋'}
                                                </span>
                                                <span className="text-sm font-medium text-gray-900">
                                                    {documentType === 'aadhaar' ? 'Aadhaar Card' :
                                                        documentType === 'pan' ? 'PAN Card' :
                                                            documentType === 'form' ? 'Registration Form' : 'Document'}
                                                </span>
                                            </div>
                                            {scanResult?.metadata?.overallConfidence && (
                                                <ConfidenceBadge score={Math.round(scanResult.metadata.overallConfidence * 100)} />
                                            )}
                                        </div>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={previewUrl}
                                            alt="Scanned document"
                                            className="w-full h-auto"
                                        />
                                        <div className="p-4 bg-gray-50 border-t border-gray-200">
                                            <button
                                                onClick={resetWorkflow}
                                                className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2"
                                            >
                                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M1 4v6h6M23 20v-6h-6" />
                                                    <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" />
                                                </svg>
                                                Upload Different Document
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Right: Form (3/5 or full width) */}
                            <div className={previewUrl ? 'lg:col-span-3' : 'lg:col-span-5'}>
                                <div className="bg-white border border-gray-200 rounded-xl">
                                    <div className="p-4 border-b border-gray-200">
                                        <h2 className="text-lg font-medium text-gray-900">Member Details</h2>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {scanResult ? 'Review and edit extracted information' : 'Enter member information'}
                                        </p>
                                    </div>

                                    <div className="p-4 space-y-4">
                                        {/* Basic Information */}
                                        <div className="space-y-4">
                                            {/* Name */}
                                            <div>
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <label className="text-sm font-medium text-gray-700">Full Name *</label>
                                                    {confidence.name > 0 && <ConfidenceIndicator score={confidence.name} size="sm" />}
                                                </div>
                                                <input
                                                    type="text"
                                                    value={formData.name}
                                                    onChange={(e) => handleFieldChange('name', e.target.value)}
                                                    className={`w-full px-4 py-3 border-2 rounded-lg transition outline-none ${getConfidenceStyle(confidence.name).bg
                                                        } ${getConfidenceStyle(confidence.name).border} focus:border-black`}
                                                    placeholder="Enter full name"
                                                />
                                            </div>

                                            {/* Phone */}
                                            <div>
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <label className="text-sm font-medium text-gray-700">Phone Number *</label>
                                                    {confidence.phone > 0 && <ConfidenceIndicator score={confidence.phone} size="sm" />}
                                                </div>
                                                <div className="flex gap-2">
                                                    <span className="flex items-center px-3 bg-gray-100 border-2 border-gray-200 rounded-lg text-gray-600 text-sm">
                                                        +91
                                                    </span>
                                                    <input
                                                        type="tel"
                                                        value={formData.phone}
                                                        onChange={(e) => handleFieldChange('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                                                        className={`flex-1 px-4 py-3 border-2 rounded-lg transition outline-none ${getConfidenceStyle(confidence.phone).bg
                                                            } ${getConfidenceStyle(confidence.phone).border} focus:border-black`}
                                                        placeholder="9876543210"
                                                        maxLength={10}
                                                    />
                                                </div>
                                            </div>

                                            {/* Email */}
                                            <div>
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <label className="text-sm font-medium text-gray-700">Email (Optional)</label>
                                                    {confidence.email > 0 && <ConfidenceIndicator score={confidence.email} size="sm" />}
                                                </div>
                                                <input
                                                    type="email"
                                                    value={formData.email}
                                                    onChange={(e) => handleFieldChange('email', e.target.value)}
                                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg transition outline-none focus:border-black"
                                                    placeholder="member@example.com"
                                                />
                                            </div>

                                            {/* Gender */}
                                            <div>
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <label className="text-sm font-medium text-gray-700">Gender</label>
                                                    {confidence.gender > 0 && <ConfidenceIndicator score={confidence.gender} size="sm" />}
                                                </div>
                                                <select
                                                    value={formData.gender}
                                                    onChange={(e) => handleFieldChange('gender', e.target.value)}
                                                    className={`w-full px-4 py-3 border-2 rounded-lg transition outline-none cursor-pointer ${getConfidenceStyle(confidence.gender).bg
                                                        } ${getConfidenceStyle(confidence.gender).border} focus:border-black`}
                                                >
                                                    <option value="">Select gender</option>
                                                    <option value="Male">Male</option>
                                                    <option value="Female">Female</option>
                                                    <option value="Other">Other</option>
                                                </select>
                                            </div>

                                            {/* Date of Birth */}
                                            <div>
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <label className="text-sm font-medium text-gray-700">Date of Birth</label>
                                                    {confidence.dateOfBirth > 0 && <ConfidenceIndicator score={confidence.dateOfBirth} size="sm" />}
                                                </div>
                                                <input
                                                    type="date"
                                                    value={formData.dateOfBirth}
                                                    onChange={(e) => handleFieldChange('dateOfBirth', e.target.value)}
                                                    className={`w-full px-4 py-3 border-2 rounded-lg transition outline-none ${getConfidenceStyle(confidence.dateOfBirth).bg
                                                        } ${getConfidenceStyle(confidence.dateOfBirth).border} focus:border-black`}
                                                />
                                            </div>
                                        </div>

                                        {/* ID Information */}
                                        <div className="pt-4 border-t border-gray-200 space-y-4">
                                            <h3 className="text-sm font-semibold text-gray-900">ID Information</h3>

                                            {/* Aadhaar */}
                                            <div>
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <label className="text-sm font-medium text-gray-700">Aadhaar Number</label>
                                                    {confidence.aadhaar > 0 && <ConfidenceIndicator score={confidence.aadhaar} size="sm" />}
                                                </div>
                                                <input
                                                    type="text"
                                                    value={formData.aadhaar}
                                                    onChange={(e) => handleFieldChange('aadhaar', e.target.value.replace(/\D/g, '').slice(0, 12))}
                                                    className={`w-full px-4 py-3 border-2 rounded-lg transition outline-none font-mono ${getConfidenceStyle(confidence.aadhaar).bg
                                                        } ${getConfidenceStyle(confidence.aadhaar).border} focus:border-black`}
                                                    placeholder="XXXX XXXX XXXX"
                                                    maxLength={12}
                                                />
                                                <p className="text-xs text-gray-400 mt-1">12-digit Aadhaar number</p>
                                            </div>

                                            {/* PAN */}
                                            <div>
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <label className="text-sm font-medium text-gray-700">PAN Number</label>
                                                    {confidence.pan > 0 && <ConfidenceIndicator score={confidence.pan} size="sm" />}
                                                </div>
                                                <input
                                                    type="text"
                                                    value={formData.pan}
                                                    onChange={(e) => handleFieldChange('pan', e.target.value.toUpperCase().slice(0, 10))}
                                                    className={`w-full px-4 py-3 border-2 rounded-lg transition outline-none font-mono uppercase ${getConfidenceStyle(confidence.pan).bg
                                                        } ${getConfidenceStyle(confidence.pan).border} focus:border-black`}
                                                    placeholder="ABCDE1234F"
                                                    maxLength={10}
                                                />
                                                <p className="text-xs text-gray-400 mt-1">10-character PAN (e.g., ABCDE1234F)</p>
                                            </div>

                                            {/* Address */}
                                            <div>
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <label className="text-sm font-medium text-gray-700">Address</label>
                                                    {confidence.address > 0 && <ConfidenceIndicator score={confidence.address} size="sm" />}
                                                </div>
                                                <textarea
                                                    value={formData.address}
                                                    onChange={(e) => handleFieldChange('address', e.target.value)}
                                                    className={`w-full px-4 py-3 border-2 rounded-lg transition outline-none resize-none ${getConfidenceStyle(confidence.address).bg
                                                        } ${getConfidenceStyle(confidence.address).border} focus:border-black`}
                                                    placeholder="Enter address"
                                                    rows={2}
                                                />
                                            </div>
                                        </div>

                                        {/* Membership Details */}
                                        <div className="pt-4 border-t border-gray-200 space-y-4">
                                            <h3 className="text-sm font-semibold text-gray-900">Membership Details</h3>

                                            {/* Plan */}
                                            <div>
                                                <label className="text-sm font-medium text-gray-700 block mb-1.5">
                                                    Membership Plan *
                                                </label>
                                                <select
                                                    value={formData.planId}
                                                    onChange={(e) => handleFieldChange('planId', e.target.value)}
                                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg transition outline-none cursor-pointer focus:border-black"
                                                >
                                                    {plans.map((plan) => (
                                                        <option key={plan.id} value={plan.id}>
                                                            {plan.name} - ₹{plan.price} ({plan.duration_days} days)
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Start Date */}
                                            <div>
                                                <label className="text-sm font-medium text-gray-700 block mb-1.5">
                                                    Membership Start Date *
                                                </label>
                                                <input
                                                    type="date"
                                                    value={formData.startDate}
                                                    onChange={(e) => handleFieldChange('startDate', e.target.value)}
                                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg transition outline-none focus:border-black"
                                                />
                                            </div>

                                            {/* Expiry Preview */}
                                            {formData.planId && calculateExpiryDate() && (
                                                <div className="p-4 bg-gray-50 rounded-lg">
                                                    <p className="text-sm text-gray-600">
                                                        Membership will expire on:{' '}
                                                        <span className="font-semibold text-gray-900">
                                                            {new Date(calculateExpiryDate()).toLocaleDateString('en-IN', {
                                                                year: 'numeric',
                                                                month: 'long',
                                                                day: 'numeric',
                                                            })}
                                                        </span>
                                                    </p>
                                                </div>
                                            )}

                                            {/* Notes */}
                                            <div>
                                                <label className="text-sm font-medium text-gray-700 block mb-1.5">
                                                    Notes (Optional)
                                                </label>
                                                <textarea
                                                    value={formData.notes}
                                                    onChange={(e) => handleFieldChange('notes', e.target.value)}
                                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg transition outline-none resize-none focus:border-black"
                                                    placeholder="Any additional notes..."
                                                    rows={2}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="p-4 border-t border-gray-200 flex flex-col sm:flex-row gap-3">
                                        <button
                                            onClick={handleSave}
                                            disabled={saving || !formData.name || !formData.phone || !formData.planId}
                                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                        >
                                            {saving ? (
                                                <>
                                                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                    </svg>
                                                    Registering...
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    Register Member
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={resetWorkflow}
                                            disabled={saving}
                                            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 transition"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step: Success */}
                {step === 'success' && (
                    <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-medium text-gray-900 mb-2">Member Registered!</h3>
                        <p className="text-gray-500 mb-8">
                            {formData.name} has been successfully added to the gym.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={resetWorkflow}
                                className="px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-900 transition"
                            >
                                Add Another Member
                            </button>
                            <button
                                onClick={() => router.push('/members')}
                                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
                            >
                                View All Members
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}

export default function AddMemberNewPage() {
    return (
        <AuthGuard>
            <AddMemberNewContent />
        </AuthGuard>
    );
}
