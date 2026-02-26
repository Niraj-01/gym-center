'use client';

/**
 * Member Dashboard - Main portal for gym members
 * Shows membership status, days remaining, payment history, and renewal option
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MemberPhoneGuard } from '@/components/auth/MemberPhoneGuard';
import { useMemberAuth } from '@/contexts/MemberAuthContext';
import { createClient } from '@/lib/supabase/client';
import { MemberAvatar } from '@/components/members/MemberAvatar';
import { GYM_NAME } from '@/lib/config';
import {
    calculateDaysRemaining,
    getMembershipStatus,
    shouldShowRenewalButton,
    formatDate
} from '@/lib/utils/membership';
import UPISettings from '@/components/member/UPISettings';

const supabase = createClient();

interface MemberData {
    id: number;
    name: string;
    email: string | null;
    phone: string;
    photoUrl: string | null;
    planName: string;
    planPrice: number;
    startDate: Date;
    expiryDate: Date;
}

interface PaymentRecord {
    id: number;
    amount: number;
    paymentDate: string;
    mode: string;
}

function MemberDashboardContent() {
    const router = useRouter();
    const { memberSession, logout } = useMemberAuth();
    const [member, setMember] = useState<MemberData | null>(null);
    const [payments, setPayments] = useState<PaymentRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (memberSession) {
            loadMemberData();
        }
    }, [memberSession]);

    const loadMemberData = async () => {
        if (!memberSession) return;

        try {
            setLoading(true);

            // Fetch member with plan details
            const { data: memberData, error: memberError } = await supabase
                .from('members')
                .select(`
                    id,
                    name,
                    email,
                    phone,
                    photo_url,
                    start_date,
                    expiry_date,
                    plans (
                        id,
                        name,
                        price
                    )
                `)
                .eq('phone', memberSession.phone)
                .single();

            if (memberError || !memberData) {
                console.error('Error fetching member:', memberError);
                return;
            }

            // Fetch payment history
            const { data: paymentsData, error: paymentsError } = await supabase
                .from('payments')
                .select('id, amount, payment_date, mode')
                .eq('member_id', memberData.id)
                .order('payment_date', { ascending: false })
                .limit(10);

            if (paymentsError) {
                console.error('Error fetching payments:', paymentsError);
            }

            setMember({
                id: memberData.id,
                name: memberData.name,
                email: memberData.email,
                phone: memberData.phone,
                photoUrl: memberData.photo_url,
                planName: (memberData.plans as unknown as { name: string } | null)?.name || 'Unknown Plan',
                planPrice: (memberData.plans as unknown as { price: number } | null)?.price || 0,
                startDate: new Date(memberData.start_date),
                expiryDate: new Date(memberData.expiry_date)
            });

            setPayments((paymentsData || []).map(p => ({
                id: p.id,
                amount: p.amount,
                paymentDate: p.payment_date,
                mode: p.mode
            })));
        } catch (error) {
            console.error('Error loading member data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !member) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-white">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-blue-600 mx-auto mb-4"></div>
                    <p className="text-sm text-gray-500">Loading your membership...</p>
                </div>
            </div>
        );
    }

    const daysRemaining = calculateDaysRemaining(member.expiryDate);
    const membershipStatus = getMembershipStatus(daysRemaining);
    const showRenewalButton = shouldShowRenewalButton(daysRemaining);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img
                            src="/logo.png"
                            alt="GymCentre"
                            className="h-5 sm:h-6"
                        />
                        <div>
                            <h1 className="text-lg sm:text-xl font-bold text-gray-900">{GYM_NAME}</h1>
                            <p className="text-xs sm:text-sm text-gray-500">Member Portal</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        Logout
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
                {/* Member Info Card */}
                <div className="bg-white rounded-2xl shadow-sm p-6">
                    <div className="flex items-center gap-4 mb-6">
                        <MemberAvatar
                            name={member.name}
                            photoUrl={member.photoUrl || undefined}
                            size="lg"
                        />
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{member.name}</h2>
                            <p className="text-sm text-gray-600">{member.phone}</p>
                            <p className="text-sm font-medium text-blue-600 mt-1">{member.planName}</p>
                        </div>
                    </div>

                    {/* Status Card with Dynamic Colors */}
                    <div className={`p-6 rounded-xl border-2 ${membershipStatus.bgColor} ${membershipStatus.borderColor}`}>
                        <div className="flex items-center justify-between mb-4">
                            <span className={`text-sm font-semibold ${membershipStatus.textColor}`}>
                                {membershipStatus.status}
                            </span>
                            {showRenewalButton && (
                                <button
                                    onClick={() => router.push('/member/renew')}
                                    className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Renew Now
                                </button>
                            )}
                        </div>

                        {/* Days Remaining - LARGE & PROMINENT */}
                        <div className="text-center py-4">
                            {membershipStatus.daysRemaining >= 0 ? (
                                <div>
                                    <p className={`text-6xl sm:text-7xl font-bold ${membershipStatus.textColor}`}>
                                        {membershipStatus.daysRemaining}
                                    </p>
                                    <p className={`text-lg sm:text-xl ${membershipStatus.textColor} mt-2`}>
                                        {membershipStatus.daysRemaining === 1 ? 'day remaining' : 'days remaining'}
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <p className={`text-5xl sm:text-6xl font-bold ${membershipStatus.textColor}`}>
                                        EXPIRED
                                    </p>
                                    <p className={`text-base sm:text-lg ${membershipStatus.textColor} mt-2`}>
                                        {Math.abs(membershipStatus.daysRemaining)} days ago
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Membership Dates */}
                        <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-current border-opacity-20">
                            <div>
                                <p className={`text-xs ${membershipStatus.textColor} opacity-75 mb-1`}>Start Date</p>
                                <p className={`font-semibold ${membershipStatus.textColor}`}>{formatDate(member.startDate)}</p>
                            </div>
                            <div>
                                <p className={`text-xs ${membershipStatus.textColor} opacity-75 mb-1`}>Expiry Date</p>
                                <p className={`font-semibold ${membershipStatus.textColor}`}>{formatDate(member.expiryDate)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Renewal CTA (if eligible) */}
                {showRenewalButton && (
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-lg p-6 text-white">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h3 className="text-lg font-bold mb-2">
                                    {membershipStatus.daysRemaining < 0 ? 'Membership Expired' : 'Expiring Soon!'}
                                </h3>
                                <p className="text-blue-100 text-sm mb-4">
                                    Renew now to continue enjoying all gym facilities
                                </p>
                                <button
                                    onClick={() => router.push('/member/renew')}
                                    className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors"
                                >
                                    Renew Membership
                                </button>
                            </div>
                            <div className="text-4xl">🔔</div>
                        </div>
                    </div>
                )}

                {/* My Workout Plan */}
                <div
                    onClick={() => router.push('/member/workout')}
                    className="bg-white rounded-2xl shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow border border-gray-100"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Workout Plan</p>
                            <p className="text-base font-bold text-gray-900">View My Workout</p>
                            <p className="text-xs text-gray-500 mt-1">
                                See your assigned exercises and log progress
                            </p>
                        </div>
                        <div className="text-3xl">🏋️</div>
                    </div>
                </div>

                {/* UPI Settings */}
                <UPISettings phone={member.phone} />

                {/* Payment History */}
                <div className="bg-white rounded-2xl shadow-sm p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Payment History</h3>

                    {payments.length > 0 ? (
                        <div className="space-y-3">
                            {payments.map((payment) => (
                                <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                    <div>
                                        <p className="font-semibold text-gray-900">₹{payment.amount.toLocaleString('en-IN')}</p>
                                        <p className="text-xs text-gray-600 mt-1">
                                            {new Date(payment.paymentDate).toLocaleDateString('en-IN', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                    <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                        {payment.mode}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-8">No payment history</p>
                    )}
                </div>

                {/* Help Section */}
                <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
                    <p className="text-sm text-gray-600">
                        Need help? Contact gym admin
                    </p>
                </div>
            </main>
        </div>
    );
}

export default function MemberDashboardPage() {
    return (
        <MemberPhoneGuard>
            <MemberDashboardContent />
        </MemberPhoneGuard>
    );
}
