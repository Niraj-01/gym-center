'use client';

/**
 * Member Payment History - View all payments for a member
 */

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Member, getMemberStatus, getStatusDisplay } from '@/lib/types/member';
import { Payment } from '@/lib/types/payment';
import { createClient } from '@/lib/supabase/client';
const supabase = createClient();


function PaymentHistoryContent() {
    const router = useRouter();
    const params = useParams();
    const memberId = params.id as string;

    const [member, setMember] = useState<Member | null>(null);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [memberId]);

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

            // Fetch payments from Supabase
            const { data: paymentsResult, error: paymentsError } = await supabase
                .from('payments')
                .select('*')
                .eq('member_id', memberId)
                .order('payment_date', { ascending: false });

            if (memberError || !memberResult) {
                console.error('❌ Error loading member:', memberError);
                alert('Member not found');
                router.push('/members');
                return;
            }

            console.log('✅ Loaded member:', memberResult.name, 'payments:', paymentsResult?.length);

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

            // Convert payments from snake_case to camelCase
            const paymentsData: Payment[] = (paymentsResult || []).map((p: any) => ({
                id: p.id,
                memberId: p.member_id,
                memberName: memberData.name,
                memberPhone: memberData.phone,
                amount: p.amount,
                paymentDate: p.payment_date ? new Date(p.payment_date) : new Date(),
                paymentMode: p.mode || 'cash',
                planId: p.plan_id,
                planName: memberData.planName,
                notes: p.notes || '',
            }));

            setMember(memberData);
            setPayments(paymentsData);
        } catch (error) {
            console.error('Error loading data:', error);
            alert('Failed to load payment history');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatPaymentMode = (mode: string) => {
        return mode.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const totalSpent = payments.reduce((sum, p) => sum + p.amount, 0);

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

    const status = getMemberStatus(member.membershipExpiryDate);
    const statusDisplay = getStatusDisplay(status);

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <button
                        onClick={() => router.push(`/members/${member.id}`)}
                        className="text-sm text-gray-600 hover:text-black transition-colors mb-4"
                    >
                        ← Back to Profile
                    </button>
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold text-black">Payment History</h1>
                            <p className="text-sm text-gray-500 mt-1">
                                {member.name} • {member.phone}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-500">Current Status</p>
                            <p className={`text-sm font-medium mt-1 ${statusDisplay.color}`}>
                                {statusDisplay.label}
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-6 mb-8">
                    <div className="p-4 border border-gray-200">
                        <p className="text-sm text-gray-500">Total Payments</p>
                        <p className="text-2xl font-semibold text-black mt-1">{payments.length}</p>
                    </div>
                    <div className="p-4 border border-gray-200">
                        <p className="text-sm text-gray-500">Total Spent</p>
                        <p className="text-2xl font-semibold text-black mt-1">
                            ₹{totalSpent.toLocaleString('en-IN')}
                        </p>
                    </div>
                    <div className="p-4 border border-gray-200">
                        <p className="text-sm text-gray-500">Member Since</p>
                        <p className="text-2xl font-semibold text-black mt-1">
                            {formatDate(member.joinDate)}
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="mb-6">
                    <button
                        onClick={() => router.push(`/members/${member.id}/payment`)}
                        className="px-6 py-3 bg-black text-white hover:bg-gray-800 transition-colors font-medium"
                    >
                        Record New Payment
                    </button>
                </div>

                {/* Payments Table */}
                {payments.length === 0 ? (
                    <div className="text-center py-16 border border-gray-200">
                        <p className="text-gray-500 mb-4">No payments recorded yet</p>
                        <button
                            onClick={() => router.push(`/members/${member.id}/payment`)}
                            className="px-6 py-3 bg-black text-white hover:bg-gray-800 transition-colors font-medium"
                        >
                            Record First Payment
                        </button>
                    </div>
                ) : (
                    <div className="border border-gray-200">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-black">Date</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-black">Plan</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-black">Amount</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-black">Mode</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-black">Notes</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {payments.map((payment) => (
                                    <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {formatDate(payment.paymentDate)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-medium text-black">{payment.planName}</p>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-black">
                                            ₹{payment.amount.toLocaleString('en-IN')}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {formatPaymentMode(payment.paymentMode)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {payment.notes || '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>
        </div>
    );
}

export default function PaymentHistoryPage() {
    return (
        <AuthGuard>
            <PaymentHistoryContent />
        </AuthGuard>
    );
}
