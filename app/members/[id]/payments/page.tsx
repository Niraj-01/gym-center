'use client';

/**
 * Member Payment History - View all payments for a member
 */

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Member, getMemberStatus, getStatusDisplay } from '@/lib/types/member';
import { Payment } from '@/lib/types/payment';
import { getMemberById, getPaymentsByMember } from '@/lib/services/mock-firestore';

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
            const [memberData, paymentsData] = await Promise.all([
                getMemberById(memberId),
                getPaymentsByMember(memberId),
            ]);

            if (!memberData) {
                alert('Member not found');
                router.push('/members');
                return;
            }

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
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-black">Expiry Change</th>
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
                                            <div>
                                                <p className="text-sm font-medium text-black">{payment.planName}</p>
                                                <p className="text-sm text-gray-500">{payment.durationDays} days</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-black">
                                            ₹{payment.amount.toLocaleString('en-IN')}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {formatPaymentMode(payment.paymentMode)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm">
                                                <p className="text-gray-500">
                                                    {formatDate(payment.previousExpiryDate)}
                                                </p>
                                                <p className="text-gray-400">↓</p>
                                                <p className="text-black font-medium">
                                                    {formatDate(payment.newExpiryDate)}
                                                </p>
                                            </div>
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
