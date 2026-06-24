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

/* Editorial label style shared across cards */
const cardLabel = "text-[10.5px] sm:text-xs uppercase tracking-[0.08em] text-[#1A1A1A]/50";

/* Animated stat card sub-component */
function AnimatedStat({ label, value, color, subtitle, delay }: {
    label: string; value: number; color: string; subtitle?: string; delay: number;
}) {
    const animatedValue = useCountUp(value, 1200, delay);
    return (
        <motion.div
            className="p-4 sm:p-5 bg-white border border-[#E2D9C9]/80 rounded-xl light-sweep-card interactive-spring"
            variants={itemVariants}
        >
            <p className={cardLabel} style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{label}</p>
            <p className="text-3xl sm:text-4xl mt-2.5" style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700, lineHeight: 1.1, color }}>
                {animatedValue}
            </p>
            {subtitle && <p className="text-[11px] text-[#1A1A1A]/40 mt-1.5">{subtitle}</p>}
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
            className="p-5 sm:p-6 bg-white border border-[#E2D9C9]/80 rounded-xl light-sweep-card interactive-spring"
            variants={itemVariants}
        >
            <p className={cardLabel} style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{label}</p>
            <p className="text-3xl sm:text-4xl mt-2.5" style={{ fontFamily: "'Zilla Slab', serif", fontWeight: 700, letterSpacing: '-0.02em', color }}>
                {formatted}
            </p>
            {subtitle && <p className="text-[11px] text-[#1A1A1A]/40 mt-1.5">{subtitle}</p>}
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
                        <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#E2D9C9] border-t-[#2D6A4F] mx-auto mb-4"></div>
                        <p className="text-sm text-[#1A1A1A]/50">Loading dashboard...</p>
                    </div>
                ) : error ? (
                    <motion.div
                        className="text-center py-12"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <p className="text-[#C0392B] mb-4">{error}</p>
                        <motion.button
                            onClick={loadDashboardData}
                            className="px-5 py-2.5 bg-[#1A1A1A] text-[#F5F2ED] rounded-[10px] hover:bg-[#2D6A4F] transition-colors"
                            style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12.5px', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}
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
                            <h2 className="text-[#1A1A1A] mb-4 sm:mb-5" style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700, fontSize: '15px', letterSpacing: 0 }}>Member Statistics</h2>
                            <motion.div
                                className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
                                variants={containerVariants}
                            >
                                <AnimatedStat label="Total Members" value={stats?.totalMembers || 0} color="#1A1A1A" delay={200} />
                                <AnimatedStat label="Active" value={stats?.activeMembers || 0} color="#2D6A4F" subtitle="7+ days remaining" delay={300} />
                                <AnimatedStat label="Expiring Soon" value={stats?.dueSoonMembers || 0} color="#C77A14" subtitle="Within 7 days" delay={400} />
                                <AnimatedStat label="Expired" value={stats?.expiredMembers || 0} color="#C0392B" subtitle="Need renewal" delay={500} />
                            </motion.div>
                        </motion.div>

                        {/* Revenue Cards */}
                        <motion.div className="mb-8" variants={itemVariants}>
                            <h2 className="text-[#1A1A1A] mb-5" style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700, fontSize: '15px', letterSpacing: 0 }}>Revenue</h2>
                            <motion.div
                                className="grid grid-cols-2 gap-3 sm:gap-4"
                                variants={containerVariants}
                            >
                                <AnimatedCurrency label="This Month" value={stats?.thisMonthRevenue || 0} color="#1A1A1A" subtitle={currentMonth || 'This month'} delay={600} />
                                <AnimatedCurrency label="Total Revenue" value={stats?.totalRevenue || 0} color="#2D6A4F" subtitle="All time" delay={700} />
                            </motion.div>
                        </motion.div>

                        {/* Recent Payments */}
                        {recentPayments.length > 0 && (
                            <motion.div className="mb-8" variants={itemVariants}>
                                <div className="flex items-center justify-between mb-5">
                                    <h2 className="text-[#1A1A1A]" style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700, fontSize: '15px', letterSpacing: 0 }}>Recent Payments</h2>
                                    <motion.button
                                        onClick={() => router.push('/members')}
                                        className="text-[#1A1A1A]/55 hover:text-[#2D6A4F] transition-colors"
                                        style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11.5px', letterSpacing: '0.04em', textTransform: 'uppercase' }}
                                        whileHover={{ x: 4 }}
                                    >
                                        View all →
                                    </motion.button>
                                </div>

                                {/* Desktop: Table */}
                                <div className="hidden md:block bg-white border border-[#E2D9C9]/80 rounded-xl overflow-hidden">
                                    <table className="w-full">
                                        <thead className="bg-[#F6F4EF] border-b border-[#E2D9C9]/80">
                                            <tr>
                                                {['Date', 'Member', 'Phone', 'Plan', 'Amount', 'Mode'].map((h) => (
                                                    <th key={h} className="px-6 py-3 text-left text-[#1A1A1A]/50" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10.5px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#E2D9C9]/60">
                                            {recentPayments.map((payment, index) => (
                                                <motion.tr
                                                    key={payment.id}
                                                    custom={index}
                                                    variants={tableRowVariants}
                                                    initial="hidden"
                                                    animate="visible"
                                                    onClick={() => router.push(`/members/${payment.memberId}`)}
                                                    className="transition-colors cursor-pointer"
                                                    whileHover={{ backgroundColor: 'rgba(45, 106, 79, 0.05)' }}
                                                >
                                                    <td className="px-6 py-4 text-sm text-[#1A1A1A]/60">
                                                        {formatDate(payment.paymentDate)}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-semibold text-[#1A1A1A]">
                                                        {payment.memberName}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-[#1A1A1A]/60">
                                                        {payment.memberPhone}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-[#1A1A1A]/60">
                                                        {payment.planName}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-semibold text-[#1A1A1A]">
                                                        {formatCurrency(payment.amount)}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-[#1A1A1A]/60">
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
                                            className="p-4 bg-white border border-[#E2D9C9]/80 rounded-xl hover:bg-[#F6F4EF] transition-colors cursor-pointer light-sweep-card interactive-spring"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex-1">
                                                    <p className="text-sm font-semibold text-[#1A1A1A]">{payment.memberName}</p>
                                                    <p className="text-xs text-[#1A1A1A]/45 mt-1">{payment.memberPhone}</p>
                                                </div>
                                                <p className="text-sm font-bold text-[#2D6A4F]">{formatCurrency(payment.amount)}</p>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-[#1A1A1A]/55">
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
                            <h2 className="text-[#1A1A1A] mb-5" style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700, fontSize: '15px', letterSpacing: 0 }}>Quick Actions</h2>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                <motion.button
                                    onClick={() => router.push('/members/add')}
                                    className="w-full sm:w-auto px-6 py-3 bg-[#1A1A1A] text-[#F5F2ED] hover:bg-[#2D6A4F] rounded-[10px] transition-colors"
                                    style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12.5px', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}
                                    whileHover={{ y: -2, transition: { type: 'spring', stiffness: 400, damping: 20 } }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    Add New Member
                                </motion.button>
                                <motion.button
                                    onClick={() => router.push('/members')}
                                    className="w-full sm:w-auto px-6 py-3 bg-white border border-[#1A1A1A]/20 text-[#1A1A1A]/80 hover:border-[#1A1A1A]/35 rounded-[10px] transition-colors"
                                    style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12.5px', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}
                                    whileHover={{ y: -2, transition: { type: 'spring', stiffness: 400, damping: 20 } }}
                                    whileTap={{ scale: 0.97 }}
                                >
                                    View All Members
                                </motion.button>
                                <motion.button
                                    onClick={() => router.push('/plans')}
                                    className="w-full sm:w-auto px-6 py-3 bg-white border border-[#1A1A1A]/20 text-[#1A1A1A]/80 hover:border-[#1A1A1A]/35 rounded-[10px] transition-colors"
                                    style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12.5px', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}
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
