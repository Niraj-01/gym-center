'use client';

/**
 * Member Dashboard - Main portal for gym members
 * Enhanced with staggered reveals, animated days counter, breathing status card.
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
import { useCountUp } from '@/lib/hooks/useCountUp';
import { motion } from 'framer-motion';

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

const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: {
            delay: i * 0.1,
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1]
        }
    })
};

const paymentItemVariants = {
    hidden: { opacity: 0, x: -16 },
    visible: (i: number) => ({
        opacity: 1,
        x: 0,
        transition: {
            delay: i * 0.06,
            duration: 0.4,
            ease: [0.22, 1, 0.36, 1]
        }
    })
};

function AnimatedDaysCounter({ value, color }: { value: number; color: string }) {
    const animated = useCountUp(Math.abs(value), 1400, 300);
    return (
        <motion.p
            className={`text-6xl sm:text-7xl font-bold ${color}`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.3 }}
        >
            {value >= 0 ? animated : 'EXPIRED'}
        </motion.p>
    );
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
            <motion.header
                className="bg-white/80 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-40"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <motion.img
                            src="/logo.png"
                            alt="GymCentre"
                            className="h-5 sm:h-6"
                            animate={{ scale: [1, 1.03, 1] }}
                            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                        />
                        <div>
                            <h1 className="text-lg sm:text-xl font-bold text-gray-900">{GYM_NAME}</h1>
                            <p className="text-xs sm:text-sm text-gray-500">Member Portal</p>
                        </div>
                    </div>
                    <motion.button
                        onClick={logout}
                        className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.97 }}
                    >
                        Logout
                    </motion.button>
                </div>
            </motion.header>

            {/* Main Content */}
            <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
                {/* Member Info Card */}
                <motion.div
                    className="bg-white rounded-2xl shadow-sm p-6 light-sweep-card"
                    custom={0}
                    variants={sectionVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <div className="flex items-center gap-4 mb-6">
                        <MemberAvatar
                            name={member.name}
                            photoUrl={member.photoUrl || undefined}
                            size="lg"
                        />
                        <motion.div
                            initial={{ opacity: 0, x: 12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <h2 className="text-xl font-bold text-gray-900">{member.name}</h2>
                            <p className="text-sm text-gray-600">{member.phone}</p>
                            <p className="text-sm font-medium text-blue-600 mt-1">{member.planName}</p>
                        </motion.div>
                    </div>

                    {/* Status Card with Dynamic Colors + breathing border */}
                    <motion.div
                        className={`p-6 rounded-xl border-2 ${membershipStatus.bgColor} ${membershipStatus.borderColor}`}
                        style={{ animation: 'breathe 4s ease-in-out infinite' }}
                        custom={1}
                        variants={sectionVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <span className={`text-sm font-semibold ${membershipStatus.textColor}`}>
                                {membershipStatus.status}
                            </span>
                            {showRenewalButton && (
                                <motion.button
                                    onClick={() => router.push('/member/renew')}
                                    className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                                    whileHover={{ y: -2, scale: 1.02 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    Renew Now
                                </motion.button>
                            )}
                        </div>

                        {/* Days Remaining - LARGE & PROMINENT with counter animation */}
                        <div className="text-center py-4">
                            {membershipStatus.daysRemaining >= 0 ? (
                                <div>
                                    <AnimatedDaysCounter value={membershipStatus.daysRemaining} color={membershipStatus.textColor} />
                                    <motion.p
                                        className={`text-lg sm:text-xl ${membershipStatus.textColor} mt-2`}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.6 }}
                                    >
                                        {membershipStatus.daysRemaining === 1 ? 'day remaining' : 'days remaining'}
                                    </motion.p>
                                </div>
                            ) : (
                                <div>
                                    <AnimatedDaysCounter value={membershipStatus.daysRemaining} color={membershipStatus.textColor} />
                                    <motion.p
                                        className={`text-base sm:text-lg ${membershipStatus.textColor} mt-2`}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.6 }}
                                    >
                                        {Math.abs(membershipStatus.daysRemaining)} days ago
                                    </motion.p>
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
                    </motion.div>
                </motion.div>

                {/* Renewal CTA (if eligible) */}
                {showRenewalButton && (
                    <motion.div
                        className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-lg p-6 text-white"
                        custom={2}
                        variants={sectionVariants}
                        initial="hidden"
                        animate="visible"
                        whileHover={{ scale: 1.01, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h3 className="text-lg font-bold mb-2">
                                    {membershipStatus.daysRemaining < 0 ? 'Membership Expired' : 'Expiring Soon!'}
                                </h3>
                                <p className="text-blue-100 text-sm mb-4">
                                    Renew now to continue enjoying all gym facilities
                                </p>
                                <motion.button
                                    onClick={() => router.push('/member/renew')}
                                    className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors"
                                    whileHover={{ y: -2, scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                >
                                    Renew Membership
                                </motion.button>
                            </div>
                            <motion.div
                                className="text-4xl"
                                animate={{ rotate: [0, -10, 10, -10, 0] }}
                                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                            >
                                🔔
                            </motion.div>
                        </div>
                    </motion.div>
                )}

                {/* My Workout Plan */}
                <motion.div
                    onClick={() => router.push('/member/workout')}
                    className="bg-white rounded-2xl shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow border border-gray-100 light-sweep-card interactive-spring"
                    custom={3}
                    variants={sectionVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Workout Plan</p>
                            <p className="text-base font-bold text-gray-900">View My Workout</p>
                            <p className="text-xs text-gray-500 mt-1">
                                See your assigned exercises and log progress
                            </p>
                        </div>
                        <motion.div
                            className="text-3xl"
                            whileHover={{ scale: 1.2, rotate: -10 }}
                        >
                            🏋️
                        </motion.div>
                    </div>
                </motion.div>

                {/* Calorie Tracker */}
                <motion.div
                    onClick={() => router.push('/member/calories')}
                    className="bg-white rounded-2xl shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow border border-gray-100 light-sweep-card interactive-spring"
                    custom={4}
                    variants={sectionVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Nutrition</p>
                            <p className="text-base font-bold text-gray-900">Calorie Tracker</p>
                            <p className="text-xs text-gray-500 mt-1">
                                Track daily calories &amp; macros with AI-powered food lookup
                            </p>
                        </div>
                        <motion.div
                            className="text-3xl"
                            whileHover={{ scale: 1.2, rotate: 10 }}
                        >
                            🍽️
                        </motion.div>
                    </div>
                </motion.div>

                {/* UPI Settings */}
                <motion.div
                    custom={5}
                    variants={sectionVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <UPISettings phone={member.phone} />
                </motion.div>

                {/* Payment History */}
                <motion.div
                    className="bg-white rounded-2xl shadow-sm p-6"
                    custom={6}
                    variants={sectionVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Payment History</h3>

                    {payments.length > 0 ? (
                        <div className="space-y-3">
                            {payments.map((payment, index) => (
                                <motion.div
                                    key={payment.id}
                                    custom={index}
                                    variants={paymentItemVariants}
                                    initial="hidden"
                                    animate="visible"
                                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg interactive-spring"
                                >
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
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-8">No payment history</p>
                    )}
                </motion.div>

                {/* Help Section */}
                <motion.div
                    className="bg-white rounded-2xl shadow-sm p-6 text-center"
                    custom={7}
                    variants={sectionVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <p className="text-sm text-gray-600">
                        Need help? Contact gym admin
                    </p>
                </motion.div>
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
