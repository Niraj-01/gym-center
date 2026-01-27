'use client';

/**
 * Add Member Page
 * 
 * Unified page for adding new members via OCR document scanning or manual entry.
 * This page orchestrates the workflow and delegates UI to child components.
 * All database mutations go through Server Actions.
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AdminLayout } from '@/components/layout/AdminLayout';

// Import member components
import {
    MethodSelector,
    DocumentUploader,
    ProcessingIndicator,
    MemberForm,
    SuccessScreen,
    type Plan,
    type FieldConfidence,
} from '@/components/members';

// Import server actions
import { getOCRUsage, scanDocument, saveMemberFromOCR, type OCRQuotaInfo, type OCRScanResult } from '@/app/actions/ocr';
import { getPlans } from '@/app/actions/plans';
import { logger } from '@/lib/utils/logger';

// Import validation helpers
import { formatPhoneForSave, cleanPhoneForForm, type MemberFormInput } from '@/lib/validation/memberSchema';

// ============================================
// TYPES
// ============================================

type WorkflowStep = 'method-select' | 'upload' | 'processing' | 'form' | 'success';
type EntryMethod = 'scan' | 'manual' | null;

// ============================================
// MAIN COMPONENT
// ============================================

function AddMemberContent() {
    const router = useRouter();
    const { user } = useAuth();

    // Workflow state
    const [step, setStep] = useState<WorkflowStep>('method-select');
    const [entryMethod, setEntryMethod] = useState<EntryMethod>(null);

    // File state
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // OCR state
    const [scanResult, setScanResult] = useState<OCRScanResult | null>(null);
    const [usage, setUsage] = useState<OCRQuotaInfo | null>(null);
    const [confidence, setConfidence] = useState<FieldConfidence>({});
    const [initialFormValues, setInitialFormValues] = useState<Partial<MemberFormInput>>({});

    // Data state
    const [plans, setPlans] = useState<Plan[]>([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [savedMemberName, setSavedMemberName] = useState<string>('');

    // Load plans on mount
    useEffect(() => {
        async function loadPlans() {
            const { data: plansData } = await getPlans();
            if (plansData && plansData.length > 0) {
                setPlans(plansData);
            }
        }
        loadPlans();
    }, []);

    // Load OCR usage
    useEffect(() => {
        async function loadUsage() {
            if (user?.email) {
                const quotaData = await getOCRUsage(user.email);
                setUsage(quotaData);
            }
        }
        loadUsage();
    }, [user]);

    // Handle method selection
    const handleMethodSelect = useCallback((method: 'scan' | 'manual') => {
        setEntryMethod(method);
        setStep(method === 'scan' ? 'upload' : 'form');
    }, []);

    // Handle file selection and auto-trigger OCR
    const handleFileSelect = useCallback(async (file: File) => {
        if (!user?.email) {
            setError('Please log in to scan documents');
            return;
        }

        // Create preview
        setPreviewUrl(URL.createObjectURL(file));
        setStep('processing');
        setError(null);

        try {
            const formDataObj = new FormData();
            formDataObj.append('document', file);

            const result = await scanDocument(formDataObj, user.email);

            if (result.success && result.data) {
                setScanResult(result);

                // Map extracted data to form initial values
                setInitialFormValues({
                    name: result.data.name || '',
                    phone: cleanPhoneForForm(result.data.phone),
                    email: result.data.email || '',
                    gender: (result.data.gender as '' | 'Male' | 'Female' | 'Other') || '',
                    aadhaar: result.data.aadhaar || '',
                    pan: result.data.pan || '',
                    address: result.data.address || '',
                    dateOfBirth: result.data.dateOfBirth || '',
                });

                // Set confidence scores
                if (result.data.confidence) {
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

                setStep('form');
            } else {
                setError(result.message || 'Failed to process document. You can enter details manually.');
                setStep('form');
            }
        } catch (err) {
            logger.error('[OCR Error]', err);
            setError('OCR processing failed. Please enter details manually.');
            setStep('form');
        }
    }, [user]);

    // Handle form save via Server Action
    const handleSave = useCallback(async (formData: MemberFormInput, expiryDate: string) => {
        if (!user?.email) {
            setError('Please log in to save');
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const result = await saveMemberFromOCR(
                {
                    name: formData.name,
                    phone: formatPhoneForSave(formData.phone),
                    email: formData.email || null,
                    gender: formData.gender || null,
                    planId: Number(formData.planId),
                    startDate: formData.startDate,
                    expiryDate: expiryDate,
                    overallConfidence: scanResult?.metadata?.overallConfidence,
                    aadhaarNumber: formData.aadhaar || null,
                    panNumber: formData.pan?.toUpperCase() || null,
                    address: formData.address || null,
                    dateOfBirth: formData.dateOfBirth || null,
                    notes: formData.notes || null,
                },
                user.email
            );

            if (result.success) {
                setSavedMemberName(formData.name);
                setStep('success');
            } else {
                setError(result.error || 'Failed to save member');
            }
        } catch (err) {
            logger.error('[Save Error]', err);
            setError('An error occurred while saving');
        } finally {
            setSaving(false);
        }
    }, [user, scanResult]);

    // Reset workflow to start fresh
    const resetWorkflow = useCallback(() => {
        setStep('method-select');
        setEntryMethod(null);
        setPreviewUrl(null);
        setScanResult(null);
        setError(null);
        setSavedMemberName('');
        setInitialFormValues({});
        setConfidence({});
    }, []);

    // Handle upload different document
    const handleUploadDifferent = useCallback(() => {
        setStep('upload');
        setPreviewUrl(null);
        setScanResult(null);
        setInitialFormValues({});
        setConfidence({});
    }, []);

    // Get step description for header
    const getStepDescription = () => {
        switch (step) {
            case 'method-select': return "Choose how you'd like to add a new member";
            case 'upload': return 'Upload a document to auto-extract member details';
            case 'processing': return 'Processing your document...';
            case 'form': return entryMethod === 'scan' ? 'Review extracted information' : 'Fill in member details';
            case 'success': return 'Member added successfully!';
        }
    };

    // Quota info for components
    const quotaInfo = usage ? {
        used: usage.used,
        limit: usage.limit,
        tier: usage.tier,
    } : null;

    return (
        <AdminLayout>
            <div className="px-3 sm:p-6 py-4 max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold text-gray-900">Add New Member</h1>
                    <p className="text-sm text-gray-500 mt-1">{getStepDescription()}</p>
                </div>

                {/* Error Alert (for steps without their own error handling) */}
                {error && step !== 'form' && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    </div>
                )}

                {/* Step: Method Selection */}
                {step === 'method-select' && (
                    <MethodSelector
                        onSelect={handleMethodSelect}
                        quotaInfo={quotaInfo}
                    />
                )}

                {/* Step: Upload Document */}
                {step === 'upload' && (
                    <DocumentUploader
                        onFileSelect={handleFileSelect}
                        onBack={resetWorkflow}
                        quotaInfo={quotaInfo}
                        error={error}
                    />
                )}

                {/* Step: Processing */}
                {step === 'processing' && (
                    <ProcessingIndicator previewUrl={previewUrl} />
                )}

                {/* Step: Form */}
                {step === 'form' && (
                    <MemberForm
                        initialValues={initialFormValues}
                        plans={plans}
                        confidence={confidence}
                        showConfidence={entryMethod === 'scan' && !!previewUrl}
                        overallConfidence={scanResult?.metadata?.overallConfidence}
                        previewUrl={previewUrl}
                        saving={saving}
                        error={error}
                        onSave={handleSave}
                        onCancel={resetWorkflow}
                        onUploadDifferent={handleUploadDifferent}
                    />
                )}

                {/* Step: Success */}
                {step === 'success' && (
                    <SuccessScreen
                        memberName={savedMemberName}
                        onAddAnother={resetWorkflow}
                    />
                )}
            </div>
        </AdminLayout>
    );
}

// ============================================
// PAGE EXPORT
// ============================================

export default function AddMemberPage() {
    return (
        <AuthGuard>
            <AddMemberContent />
        </AuthGuard>
    );
}
