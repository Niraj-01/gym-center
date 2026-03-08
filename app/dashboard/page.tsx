'use client';

/**
 * Dashboard - Main analytics and stats view
 * Enhanced with staggered reveals, animated counters, and live-feel stat updates.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { GYM_NAME } from '@/lib/config';
import { getDashboardData, DashboardStats, DashboardPayment } from '@/app/actions/dashboard';
import { useCountUp } from '@/lib/hooks/useCountUp';
import { motion } from 'framer-motion';

/* Framer Motion animation presets */
const containerVariants = {
    hidden: {},
    visible: {
        transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.97 },
    visible: {
        opacity: 1, y: 0, scale: 1,
        transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }
    }
};

const tableRowVariants = {
    hidden: { opacity: 0, x: -12 },
    visible: (i: number) => ({
        opacity: 1, x: 0,
        transition: { delay: i * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }
    })
};

/* Animated stat card sub-component */
function AnimatedStat({ label, value, color, subtitle, delay }: {
    label: string; value: number; color: string; subtitle?: string; delay: number;
}) {
    const animatedValue = useCountUp(value, 1200, delay);
    return (
        <motion.div
            className="p-4 sm:p-6 border border-gray-200 rounded-xl light-sweep-card interactive-spring"
            variants={itemVariants}
        >
            <p className="text-sm text-gray-500">{label}</p>
            <p className={`text-2xl sm:text-3xl font-semibold mt-2 ${color}`}>
                {animatedValue}
            </p>
            {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </motion.div>
    );
}

function AnimatedCurrency({ label, value, color, subtitle, delay }: {
    label: string; value: number; color: string; subtitle?: string; delay: number;
}) {
    const animatedValue = useCountUp(value, 1400, delay);
    const formatted = `₹${animatedValue.toLocaleString('en-IN')}`;
    return (
        <motion.div
            className="p-6 border border-gray-200 rounded-xl light-sweep-card interactive-spring"
            variants={itemVariants}
        >
            <p className="text-sm text-gray-500">{label}</p>
            <p className={`text-3xl font-semibold mt-2 ${color}`}>
                {formatted}
            </p>
            {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </motion.div>
    );
}

function DashboardContent() {
    const router = useRouter();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [recentPayments, setRecentPayments] = useState<DashboardPayment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Single optimized call that fetches all dashboard data
            const result = await getDashboardData();

            if (result.error) {
                setError(result.error);
                console.error('Dashboard error:', result.error);
            } else if (result.data) {
                setStats(result.data.stats);
                setRecentPayments(result.data.recentPayments);
            }
        } catch (err) {
            console.error('Error loading dashboard:', err);
            setError('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return `₹${amount.toLocaleString('en-IN')}`;
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatPaymentMode = (mode: string) => {
        return mode.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const [currentMonth, setCurrentMonth] = useState('');

    useEffect(() => {
        setCurrentMonth(new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }));
    }, []);

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
                <PageHeader
                    title="Dashboard"
                    description={`${GYM_NAME} management overview`}
                    actionLabel="Add Member"
                    onAction={() => router.push('/members/add')}
                />

                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-black mx-auto mb-4"></div>
                        <p className="text-sm text-gray-500">Loading dashboard...</p>
                    </div>
                ) : error ? (
                    <motion.div
                        className="text-center py-12"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <p className="text-red-600 mb-4">{error}</p>
                        <motion.button
                            onClick={loadDashboardData}
                            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Retry
                        </motion.button>
                    </motion.div>
                ) : (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        {/* Member Stats Cards */}
                        <motion.div className="mb-8" variants={itemVariants}>
                            <h2 className="text-base sm:text-lg font-medium text-black mb-4 sm:mb-6">Member Statistics</h2>
                            <motion.div
                                className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
                                variants={containerVariants}
                            >
                                <AnimatedStat label="Total Members" value={stats?.totalMembers || 0} color="text-black" delay={200} />
                                <AnimatedStat label="Active" value={stats?.activeMembers || 0} color="text-green-600" subtitle="7+ days remaining" delay={300} />
                                <AnimatedStat label="Expiring Soon" value={stats?.dueSoonMembers || 0} color="text-yellow-600" subtitle="Within 7 days" delay={400} />
                                <AnimatedStat label="Expired" value={stats?.expiredMembers || 0} color="text-red-600" subtitle="Need renewal" delay={500} />
                            </motion.div>
                        </motion.div>

                        {/* Revenue Cards */}
                        <motion.div className="mb-8" variants={itemVariants}>
                            <h2 className="text-lg font-medium text-black mb-6">Revenue</h2>
                            <motion.div
                                className="grid grid-cols-2 gap-3 sm:gap-4"
                                variants={containerVariants}
                            >
                                <AnimatedCurrency label="This Month" value={stats?.thisMonthRevenue || 0} color="text-black" subtitle={currentMonth || 'This month'} delay={600} />
                                <AnimatedCurrency label="Total Revenue" value={stats?.totalRevenue || 0} color="text-black" subtitle="All time" delay={700} />
                            </motion.div>
                        </motion.div>

                        {/* Recent Payments */}
                        {recentPayments.length > 0 && (
                            <motion.div className="mb-8" variants={itemVariants}>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-lg font-medium text-black">Recent Payments</h2>
                                    <motion.button
                                        onClick={() => router.push('/members')}
                                        className="text-sm text-gray-600 hover:text-black transition-colors"
                                        whileHover={{ x: 4 }}
                                    >
                                        View all →
                                    </motion.button>
                                </div>

                                {/* Desktop: Table */}
                                <div className="hidden md:block border border-gray-200 rounded-xl overflow-hidden">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Date</th>
                                                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Member</th>
                                                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Phone</th>
                                                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Plan</th>
                                                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Amount</th>
                                                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Mode</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {recentPayments.map((payment, index) => (
                                                <motion.tr
                                                    key={payment.id}
                                                    custom={index}
                                                    variants={tableRowVariants}
                                                    initial="hidden"
                                                    animate="visible"
                                                    onClick={() => router.push(`/members/${payment.memberId}`)}
                                                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                                                    whileHover={{ backgroundColor: 'rgba(var(--color-primary), 0.03)' }}
                                                >
                                                    <td className="px-6 py-4 text-sm text-gray-600">
                                                        {formatDate(payment.paymentDate)}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-medium text-black">
                                                        {payment.memberName}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">
                                                        {payment.memberPhone}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">
                                                        {payment.planName}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-medium text-black">
                                                        {formatCurrency(payment.amount)}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">
                                                        {formatPaymentMode(payment.paymentMode)}
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile: Cards */}
                                <div className="md:hidden space-y-3">
                                    {recentPayments.map((payment, index) => (
                                        <motion.div
                                            key={payment.id}
                                            custom={index}
                                            variants={tableRowVariants}
                                            initial="hidden"
                                            animate="visible"
                                            onClick={() => router.push(`/members/${payment.memberId}`)}
                                            className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer light-sweep-card interactive-spring"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-black">{payment.memberName}</p>
                                                    <p className="text-xs text-gray-500 mt-1">{payment.memberPhone}</p>
                                                </div>
                                                <p className="text-sm font-semibold text-black">{formatCurrency(payment.amount)}</p>
                                            </div>
                                            <div className="flex items-center justify-between text-xs text-gray-600">
                                                <span>{formatDate(payment.paymentDate)}</span>
                                                <span>•</span>
                                                <span>{payment.planName}</span>
                                                <span>•</span>
                                                <span>{formatPaymentMode(payment.paymentMode)}</span>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Quick Actions */}
                        <motion.div variants={itemVariants}>
                            <h2 className="text-lg font-medium text-black mb-6">Quick Actions</h2>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                <motion.button
                                    onClick={() => router.push('/members/add')}
                                    className="w-full sm:w-auto px-6 py-3 bg-black text-white hover:bg-gray-800 rounded-lg transition-colors font-medium text-sm animate-pulse-glow"
                                    whileHover={{ y: -2, transition: { type: 'spring', stiffness: 400, damping: 20 } }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    Add New Member
                                </motion.button>
                                <motion.button
                                    onClick={() => router.push('/members')}
                                    className="w-full sm:w-auto px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors font-medium text-sm"
                                    whileHover={{ y: -2, transition: { type: 'spring', stiffness: 400, damping: 20 } }}
                                    whileTap={{ scale: 0.97 }}
                                >
                                    View All Members
                                </motion.button>
                                <motion.button
                                    onClick={() => router.push('/plans')}
                                    className="w-full sm:w-auto px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors font-medium text-sm"
                                    whileHover={{ y: -2, transition: { type: 'spring', stiffness: 400, damping: 20 } }}
                                    whileTap={{ scale: 0.97 }}
                                >
                                    Manage Plans
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </div>
        </AdminLayout>
    );
}

export default function DashboardPage() {
    return (
        <AuthGuard>
            <DashboardContent />
        </AuthGuard>
    );
}
