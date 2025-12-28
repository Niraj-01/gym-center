'use client';

/**
 * Record Payment Form - Extend member's membership
 */

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useAuth } from '@/contexts/AuthContext';
import { Member } from '@/lib/types/member';
import { Plan } from '@/lib/types/plan';
import { PaymentFormData, PaymentMode } from '@/lib/types/payment';
import { createClient } from '@/lib/supabase/client';
const supabase = createClient();


// Inline expiry calculation (previously from mock-firestore)
function calculateNewExpiry(
    currentExpiryDate: Date,
    planDuration: number
): { startDate: Date; expiryDate: Date } {
    const today = new Date();
    const startDate = currentExpiryDate < today ? today : currentExpiryDate;
    const expiryDate = new Date(startDate);
    expiryDate.setDate(expiryDate.getDate() + planDuration);
    return { startDate, expiryDate };
}

function RecordPaymentFormContent() {
    const router = useRouter();
    const params = useParams();
    const { user } = useAuth();
    const memberId = params.id as string;

    const [member, setMember] = useState<Member | null>(null);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState<Omit<PaymentFormData, 'memberId'>>({
        planId: '',
        amount: 0,
        paymentDate: new Date(),
        paymentMode: 'cash' as PaymentMode,
        notes: '',
        receiptNumber: '',
    });

    const [expiryPreview, setExpiryPreview] = useState<{ startDate: Date; expiryDate: Date } | null>(null);

    useEffect(() => {
        loadData();
    }, [memberId]);

    useEffect(() => {
        if (member && formData.planId) {
            const plan = plans.find(p => p.id === formData.planId);
            if (plan) {
                const preview = calculateNewExpiry(member.membershipExpiryDate, plan.duration);
                setExpiryPreview(preview);
            }
        }
    }, [member, formData.planId, plans]);

    const loadData = async () => {
        try {
            setLoading(true);

            // Fetch member from Supabase - using CORRECT column names
            const { data: memberResult, error: memberError } = await supabase
                .from('members')
                .select(`
                    id, name, email, phone, photo_url, plan_id,
                    start_date, expiry_date, created_at,
                    plans (id, name, price, duration_days)
                `)
                .eq('id', memberId)
                .single();

            // Fetch active plans from Supabase
            const { data: plansResult, error: plansError } = await supabase
                .from('plans')
                .select('*')
                .eq('is_active', true);

            if (memberError || !memberResult) {
                console.error('❌ Error loading member:', memberError);
                alert('Member not found');
                router.push('/members');
                return;
            }

            console.log('✅ Loaded member for payment:', memberResult.name);

            // Convert member from snake_case to camelCase - CORRECT column names
            const memberData: Member = {
                id: memberResult.id,
                name: memberResult.name,
                phone: memberResult.phone,
                email: memberResult.email,
                photoUrl: memberResult.photo_url,
                joinDate: memberResult.start_date ? new Date(memberResult.start_date) : new Date(),
                planId: memberResult.plan_id,
                planName: (memberResult.plans as any)?.name || 'Unknown',
                membershipStartDate: memberResult.start_date ? new Date(memberResult.start_date) : new Date(),
                membershipExpiryDate: memberResult.expiry_date ? new Date(memberResult.expiry_date) : new Date(),
                notes: '',
                isActive: true,
                createdAt: memberResult.created_at ? new Date(memberResult.created_at) : new Date(),
                updatedAt: memberResult.created_at ? new Date(memberResult.created_at) : new Date(),
            };

            // Convert plans from snake_case to camelCase - CORRECT column name
            const plansData: Plan[] = (plansResult || []).map((p: any) => ({
                id: p.id,
                name: p.name,
                duration: p.duration_days, // Map duration_days to duration
                price: p.price,
                description: p.description,
                isActive: p.is_active,
                createdAt: p.created_at ? new Date(p.created_at) : new Date(),
                updatedAt: p.created_at ? new Date(p.created_at) : new Date(),
            }));

            setMember(memberData);
            setPlans(plansData);

            // Default to current plan
            setFormData(prev => ({
                ...prev,
                planId: memberData.planId,
            }));

            // Set amount from current plan
            const currentPlan = plansData.find(p => p.id === memberData.planId);
            if (currentPlan) {
                setFormData(prev => ({
                    ...prev,
                    amount: currentPlan.price,
                }));
            }
        } catch (error) {
            console.error('Error loading data:', error);
            alert('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handlePlanChange = (planId: string) => {
        const plan = plans.find(p => p.id === planId);
        setFormData({
            ...formData,
            planId,
            amount: plan?.price || 0,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.planId || formData.amount <= 0) {
            alert('Please fill in all required fields');
            return;
        }

        if (formData.paymentDate > new Date()) {
            alert('Payment date cannot be in the future');
            return;
        }

        if (!user?.email || !member) {
            alert('User email or member not found');
            return;
        }

        try {
            setSubmitting(true);

            // Get the selected plan
            const plan = plans.find(p => p.id === formData.planId);
            if (!plan) {
                throw new Error('Plan not found');
            }

            // Calculate new expiry
            const today = new Date();
            const currentExpiry = member.membershipExpiryDate;
            const startDate = currentExpiry < today ? today : currentExpiry;
            const newExpiry = new Date(startDate);
            newExpiry.setDate(newExpiry.getDate() + plan.duration);

            // Create payment record in Supabase - using CORRECT column names
            const { error: paymentError } = await supabase
                .from('payments')
                .insert({
                    member_id: memberId,
                    amount: formData.amount,
                    payment_date: formData.paymentDate.toISOString().split('T')[0], // YYYY-MM-DD
                    mode: formData.paymentMode, // CORRECT: use 'mode' not 'payment_mode'
                });

            if (paymentError) {
                console.error('❌ Payment insert error:', paymentError);
                throw paymentError;
            }

            console.log('✅ Payment created');

            // Update member's membership in Supabase - using CORRECT column names
            const { error: memberError } = await supabase
                .from('members')
                .update({
                    plan_id: plan.id,
                    start_date: startDate.toISOString().split('T')[0], // YYYY-MM-DD
                    expiry_date: newExpiry.toISOString().split('T')[0], // YYYY-MM-DD
                })
                .eq('id', memberId);

            if (memberError) {
                throw memberError;
            }

            router.push(`/members/${memberId}`);
        } catch (error) {
            console.error('Error creating payment:', error);
            alert('Failed to record payment');
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-white">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-black mx-auto mb-4"></div>
                    <p className="text-sm text-gray-500">Loading...</p>
                </div>
            </div>
        );
    }

    if (!member) {
        return null;
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-3xl mx-auto px-6 py-6">
                    <button
                        onClick={() => router.push(`/members/${member.id}`)}
                        className="text-sm text-gray-600 hover:text-black transition-colors mb-4"
                    >
                        ← Back to Profile
                    </button>
                    <h1 className="text-2xl font-semibold text-black">Record Payment</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Extend membership for {member.name}
                    </p>
                </div>
            </header>

            {/* Form */}
            <main className="max-w-3xl mx-auto px-6 py-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Member Info (Read-only) */}
                    <div className="border-b border-gray-200 pb-8">
                        <h2 className="text-base font-semibold text-black mb-6">Member Information</h2>

                        <div className="grid grid-cols-2 gap-6 p-4 border border-gray-200 bg-gray-50">
                            <div>
                                <p className="text-sm text-gray-500">Name</p>
                                <p className="text-sm font-medium text-black mt-1">{member.name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Phone</p>
                                <p className="text-sm font-medium text-black mt-1">{member.phone}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Current Plan</p>
                                <p className="text-sm font-medium text-black mt-1">{member.planName}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Current Expiry</p>
                                <p className="text-sm font-medium text-black mt-1">
                                    {formatDate(member.membershipExpiryDate)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Payment Details */}
                    <div className="border-b border-gray-200 pb-8">
                        <h2 className="text-base font-semibold text-black mb-6">Payment Details</h2>

                        <div className="space-y-6">
                            {/* Plan Selection */}
                            <div>
                                <label htmlFor="planId" className="block text-sm font-medium text-black mb-2">
                                    Membership Plan *
                                </label>
                                <select
                                    id="planId"
                                    required
                                    value={formData.planId}
                                    onChange={(e) => handlePlanChange(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 text-black focus:outline-none focus:border-black transition-colors"
                                >
                                    <option value="">Select a plan</option>
                                    {plans.map((plan) => (
                                        <option key={plan.id} value={plan.id}>
                                            {plan.name} - {plan.duration} days - ₹{plan.price.toLocaleString('en-IN')}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Amount */}
                            <div>
                                <label htmlFor="amount" className="block text-sm font-medium text-black mb-2">
                                    Payment Amount (₹) *
                                </label>
                                <input
                                    type="number"
                                    id="amount"
                                    required
                                    min={1}
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: parseInt(e.target.value) || 0 })}
                                    className="w-full px-4 py-3 border border-gray-300 text-black focus:outline-none focus:border-black transition-colors"
                                />
                                <p className="mt-2 text-sm text-gray-500">
                                    Can be adjusted for discounts or custom pricing
                                </p>
                            </div>

                            {/* Payment Date */}
                            <div>
                                <label htmlFor="paymentDate" className="block text-sm font-medium text-black mb-2">
                                    Payment Date *
                                </label>
                                <input
                                    type="date"
                                    id="paymentDate"
                                    required
                                    value={formData.paymentDate.toISOString().split('T')[0]}
                                    onChange={(e) => setFormData({ ...formData, paymentDate: new Date(e.target.value) })}
                                    max={new Date().toISOString().split('T')[0]}
                                    className="w-full px-4 py-3 border border-gray-300 text-black focus:outline-none focus:border-black transition-colors"
                                />
                            </div>

                            {/* Payment Mode */}
                            <div>
                                <label htmlFor="paymentMode" className="block text-sm font-medium text-black mb-2">
                                    Payment Mode *
                                </label>
                                <select
                                    id="paymentMode"
                                    required
                                    value={formData.paymentMode}
                                    onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value as PaymentMode })}
                                    className="w-full px-4 py-3 border border-gray-300 text-black focus:outline-none focus:border-black transition-colors"
                                >
                                    <option value="cash">Cash</option>
                                    <option value="upi">UPI</option>
                                    <option value="card">Card</option>
                                    <option value="bank-transfer">Bank Transfer</option>
                                </select>
                            </div>

                            {/* Receipt Number */}
                            <div>
                                <label htmlFor="receiptNumber" className="block text-sm font-medium text-black mb-2">
                                    Receipt Number (Optional)
                                </label>
                                <input
                                    type="text"
                                    id="receiptNumber"
                                    value={formData.receiptNumber}
                                    onChange={(e) => setFormData({ ...formData, receiptNumber: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 text-black focus:outline-none focus:border-black transition-colors"
                                    placeholder="e.g., REC-001"
                                />
                            </div>

                            {/* Notes */}
                            <div>
                                <label htmlFor="notes" className="block text-sm font-medium text-black mb-2">
                                    Notes (Optional)
                                </label>
                                <textarea
                                    id="notes"
                                    rows={3}
                                    maxLength={500}
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 text-black focus:outline-none focus:border-black transition-colors resize-none"
                                    placeholder="Any additional notes..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Expiry Preview */}
                    {expiryPreview && (
                        <div className="p-4 border border-gray-200 bg-gray-50">
                            <h3 className="text-sm font-semibold text-black mb-3">Membership Extension Preview</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-500">Start Date</p>
                                    <p className="font-medium text-black mt-1">{formatDate(expiryPreview.startDate)}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">New Expiry Date</p>
                                    <p className="font-medium text-black mt-1">{formatDate(expiryPreview.expiryDate)}</p>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-3">
                                {member.membershipExpiryDate < new Date()
                                    ? 'Member is expired. Membership will restart from today.'
                                    : 'Member is active. Membership will be extended from current expiry date.'}
                            </p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-4 pt-6 border-t border-gray-200">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-8 py-3 bg-black text-white hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? 'Recording Payment...' : 'Record Payment'}
                        </button>
                        <button
                            type="button"
                            onClick={() => router.push(`/members/${member.id}`)}
                            disabled={submitting}
                            className="px-8 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}

export default function RecordPaymentPage() {
    return (
        <AuthGuard>
            <RecordPaymentFormContent />
        </AuthGuard>
    );
}
