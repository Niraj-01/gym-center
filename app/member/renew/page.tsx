'use client';

/**
 * Member Renewal Page - Multi-step flow for membership renewal
 * Step 1: Select Plan → Step 2: Review & Pay → Step 3: Confirmation
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MemberPhoneGuard } from '@/components/auth/MemberPhoneGuard';
import { useMemberAuth } from '@/contexts/MemberAuthContext';
import { createClient } from '@/lib/supabase/client';
import { calculateNewExpiry, formatDate } from '@/lib/utils/membership';
import { generateRenewalUPILink } from '@/lib/utils/upi';

const supabase = createClient();

interface Plan {
    id: number;
    name: string;
    price: number;
    durationDays: number;
}

interface MemberInfo {
    id: number;
    name: string;
    expiryDate: Date;
}

type Step = 'select-plan' | 'payment-summary' | 'confirmation';

function MemberRenewalContent() {
    const router = useRouter();
    const { memberSession } = useMemberAuth();
    const [step, setStep] = useState<Step>('select-plan');
    const [plans, setPlans] = useState<Plan[]>([]);
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
    const [memberInfo, setMemberInfo] = useState<MemberInfo | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [memberSession]);

    const loadData = async () => {
        if (!memberSession) return;

        try {
            setLoading(true);

            // Fetch active plans
            const { data: plansData, error: plansError } = await supabase
                .from('plans')
                .select('id, name, price, duration_days')
                .eq('is_active', true)
                .order('price', { ascending: true });

            if (plansError) {
                console.error('Error fetching plans:', plansError);
                return;
            }

            // Fetch member info
            const { data: memberData, error: memberError } = await supabase
                .from('members')
                .select('id, name, expiry_date')
                .eq('phone', memberSession.phone)
                .single();

            if (memberError || !memberData) {
                console.error('Error fetching member:', memberError);
                return;
            }

            setPlans(
                (plansData || []).map((p: { id: number; name: string; price: number; duration_days: number }) => ({
                    id: p.id,
                    name: p.name,
                    price: p.price,
                    durationDays: p.duration_days
                }))
            );

            setMemberInfo({
                id: memberData.id,
                name: memberData.name,
                expiryDate: new Date(memberData.expiry_date)
            });
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePlanSelect = (plan: Plan) => {
        setSelectedPlan(plan);
        setStep('payment-summary');
    };

    const handlePayNow = () => {
        if (!selectedPlan) return;

        // Generate UPI deep link
        const upiLink = generateRenewalUPILink(selectedPlan.name, selectedPlan.price);

        // Open UPI app
        window.location.href = upiLink;

        // Show confirmation after a delay (user returns from UPI app)
        setTimeout(() => {
            setStep('confirmation');
        }, 1000);
    };

    if (loading || !memberInfo) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-white">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-blue-600 mx-auto mb-4"></div>
                    <p className="text-sm text-gray-500">Loading...</p>
                </div>
            </div>
        );
    }

    const newExpiryDate = selectedPlan
        ? calculateNewExpiry(memberInfo.expiryDate, selectedPlan.durationDays)
        : null;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => step === 'select-plan' ? router.push('/member/dashboard') : setStep('select-plan')}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <div>
                            <h1 className="text-lg sm:text-xl font-bold text-gray-900">Renew Membership</h1>
                            <p className="text-xs sm:text-sm text-gray-500">
                                {step === 'select-plan' && 'Choose your plan'}
                                {step === 'payment-summary' && 'Review and pay'}
                                {step === 'confirmation' && 'Payment status'}
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
                {/* Step 1: Plan Selection */}
                {step === 'select-plan' && (
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Select a Plan</h2>
                        {plans.map((plan) => (
                            <button
                                key={plan.id}
                                onClick={() => handlePlanSelect(plan)}
                                className="w-full p-6 bg-white rounded-2xl shadow-sm hover:shadow-md border-2 border-transparent hover:border-blue-500 transition-all text-left"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                                        <p className="text-sm text-gray-600 mt-1">{plan.durationDays} days</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-blue-600">₹{plan.price.toLocaleString('en-IN')}</p>
                                        <p className="text-xs text-gray-500 mt-1">per {plan.name.toLowerCase()}</p>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {/* Step 2: Payment Summary */}
                {step === 'payment-summary' && selectedPlan && newExpiryDate && (
                    <div className="space-y-6">
                        {/* Summary Card */}
                        <div className="bg-white rounded-2xl shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-6">Payment Summary</h2>

                            <div className="space-y-4">
                                <div className="flex justify-between py-3 border-b border-gray-100">
                                    <span className="text-gray-600">Plan</span>
                                    <span className="font-semibold text-gray-900">{selectedPlan.name}</span>
                                </div>
                                <div className="flex justify-between py-3 border-b border-gray-100">
                                    <span className="text-gray-600">Duration</span>
                                    <span className="font-semibold text-gray-900">{selectedPlan.durationDays} days</span>
                                </div>
                                <div className="flex justify-between py-3 border-b border-gray-100">
                                    <span className="text-gray-600">Current Expiry</span>
                                    <span className="font-semibold text-gray-900">{formatDate(memberInfo.expiryDate)}</span>
                                </div>
                                <div className="flex justify-between py-3 border-b border-gray-100">
                                    <span className="text-gray-600">New Expiry Date</span>
                                    <span className="font-semibold text-green-600">{formatDate(newExpiryDate)}</span>
                                </div>
                                <div className="flex justify-between py-4 mt-4 border-t-2 border-gray-200">
                                    <span className="text-lg font-semibold text-gray-900">Total Amount</span>
                                    <span className="text-2xl font-bold text-blue-600">₹{selectedPlan.price.toLocaleString('en-IN')}</span>
                                </div>
                            </div>
                        </div>

                        {/* Payment Button */}
                        <button
                            onClick={handlePayNow}
                            className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-lg font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg"
                        >
                            Pay ₹{selectedPlan.price.toLocaleString('en-IN')} via UPI
                        </button>

                        <p className="text-xs text-gray-500 text-center">
                            You&apos;ll be redirected to your UPI app to complete payment
                        </p>
                    </div>
                )}

                {/* Step 3: Confirmation */}
                {step === 'confirmation' && selectedPlan && (
                    <div className="text-center">
                        <div className="bg-white rounded-2xl shadow-sm p-8">
                            {/* Success Icon */}
                            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>

                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment Pending Verification</h2>
                            <p className="text-gray-600 mb-8">
                                Your payment is being processed. The gym admin will verify and update your membership within 24 hours.
                            </p>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                                <p className="text-sm text-blue-900">
                                    <strong>Amount Paid:</strong> ₹{selectedPlan.price.toLocaleString('en-IN')}
                                </p>
                                <p className="text-sm text-blue-900 mt-2">
                                    <strong>Plan:</strong> {selectedPlan.name}
                                </p>
                            </div>

                            <button
                                onClick={() => router.push('/member/dashboard')}
                                className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Back to Dashboard
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default function MemberRenewalPage() {
    return (
        <MemberPhoneGuard>
            <MemberRenewalContent />
        </MemberPhoneGuard>
    );
}
