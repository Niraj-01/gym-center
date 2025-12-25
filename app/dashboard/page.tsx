'use client';

/**
 * Dashboard - Main analytics and stats view
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useAuth } from '@/contexts/AuthContext';
import { Payment } from '@/lib/types/payment';
import { getDashboardStats, getRecentPayments, DashboardStats } from '@/lib/services/mock-firestore';
import { GYM_NAME, PRODUCT_NAME } from '@/lib/config';

function DashboardContent() {
    const router = useRouter();
    const { user, signOut } = useAuth();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            const [statsData, paymentsData] = await Promise.all([
                getDashboardStats(),
                getRecentPayments(10),
            ]);
            setStats(statsData);
            setRecentPayments(paymentsData);
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return `₹${amount.toLocaleString('en-IN')}`;
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

    const getCurrentMonth = () => {
        return new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-black">{GYM_NAME}</h1>
                        <p className="text-sm text-gray-500 mt-1">{PRODUCT_NAME} Dashboard</p>
                    </div>

                    <div className="flex items-center gap-6">
                        {/* Navigation */}
                        <button
                            onClick={() => router.push('/members')}
                            className="px-4 py-2 text-sm text-gray-700 hover:text-black hover:bg-gray-100 rounded-md transition-colors"
                        >
                            Members
                        </button>
                        <button
                            onClick={() => router.push('/plans')}
                            className="px-4 py-2 text-sm text-gray-700 hover:text-black hover:bg-gray-100 rounded-md transition-colors"
                        >
                            Plans
                        </button>

                        {/* User Info */}
                        <div className="text-right border-l border-gray-200 pl-6">
                            <p className="text-sm font-medium text-black">{user?.displayName || 'Admin'}</p>
                            <p className="text-sm text-gray-500">{user?.email}</p>
                        </div>

                        {/* Sign Out */}
                        <button
                            onClick={() => signOut()}
                            className="px-6 py-2 border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-black mx-auto mb-4"></div>
                        <p className="text-sm text-gray-500">Loading dashboard...</p>
                    </div>
                ) : (
                    <>
                        {/* Member Stats Cards */}
                        <div className="mb-8">
                            <h2 className="text-lg font-semibold text-black mb-6">Member Statistics</h2>
                            <div className="grid grid-cols-4 gap-6">
                                {/* Total Members */}
                                <div className="p-6 border border-gray-200">
                                    <p className="text-sm text-gray-500">Total Members</p>
                                    <p className="text-3xl font-semibold text-black mt-2">
                                        {stats?.totalMembers || 0}
                                    </p>
                                </div>

                                {/* Active Members */}
                                <div className="p-6 border border-gray-200">
                                    <p className="text-sm text-gray-500">Active</p>
                                    <p className="text-3xl font-semibold text-gray-900 mt-2">
                                        {stats?.activeMembers || 0}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">7+ days remaining</p>
                                </div>

                                {/* Expiring Soon */}
                                <div className="p-6 border border-gray-200">
                                    <p className="text-sm text-gray-500">Expiring Soon</p>
                                    <p className="text-3xl font-semibold text-gray-600 mt-2">
                                        {stats?.dueSoonMembers || 0}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">Within 7 days</p>
                                </div>

                                {/* Expired */}
                                <div className="p-6 border border-gray-200">
                                    <p className="text-sm text-gray-500">Expired</p>
                                    <p className="text-3xl font-semibold text-gray-400 mt-2">
                                        {stats?.expiredMembers || 0}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">Need renewal</p>
                                </div>
                            </div>
                        </div>

                        {/* Revenue Cards */}
                        <div className="mb-8">
                            <h2 className="text-lg font-semibold text-black mb-6">Revenue</h2>
                            <div className="grid grid-cols-2 gap-6">
                                {/* This Month Revenue */}
                                <div className="p-6 border border-gray-200">
                                    <p className="text-sm text-gray-500">This Month</p>
                                    <p className="text-3xl font-semibold text-black mt-2">
                                        {formatCurrency(stats?.thisMonthRevenue || 0)}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">{getCurrentMonth()}</p>
                                </div>

                                {/* Total Revenue */}
                                <div className="p-6 border border-gray-200">
                                    <p className="text-sm text-gray-500">Total Revenue</p>
                                    <p className="text-3xl font-semibold text-black mt-2">
                                        {formatCurrency(stats?.totalRevenue || 0)}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">All time</p>
                                </div>
                            </div>
                        </div>

                        {/* Recent Payments */}
                        {recentPayments.length > 0 && (
                            <div className="mb-8">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-lg font-semibold text-black">Recent Payments</h2>
                                    <button
                                        onClick={() => router.push('/members')}
                                        className="text-sm text-gray-600 hover:text-black transition-colors"
                                    >
                                        View all members →
                                    </button>
                                </div>

                                <div className="border border-gray-200">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-sm font-semibold text-black">Date</th>
                                                <th className="px-6 py-3 text-left text-sm font-semibold text-black">Member</th>
                                                <th className="px-6 py-3 text-left text-sm font-semibold text-black">Phone</th>
                                                <th className="px-6 py-3 text-left text-sm font-semibold text-black">Plan</th>
                                                <th className="px-6 py-3 text-left text-sm font-semibold text-black">Amount</th>
                                                <th className="px-6 py-3 text-left text-sm font-semibold text-black">Mode</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {recentPayments.map((payment) => (
                                                <tr
                                                    key={payment.id}
                                                    onClick={() => router.push(`/members/${payment.memberId}`)}
                                                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                                                >
                                                    <td className="px-6 py-3 text-sm text-gray-600">
                                                        {formatDate(payment.paymentDate)}
                                                    </td>
                                                    <td className="px-6 py-3 text-sm font-medium text-black">
                                                        {payment.memberName}
                                                    </td>
                                                    <td className="px-6 py-3 text-sm text-gray-600">
                                                        {payment.memberPhone}
                                                    </td>
                                                    <td className="px-6 py-3 text-sm text-gray-600">
                                                        {payment.planName}
                                                    </td>
                                                    <td className="px-6 py-3 text-sm font-medium text-black">
                                                        {formatCurrency(payment.amount)}
                                                    </td>
                                                    <td className="px-6 py-3 text-sm text-gray-600">
                                                        {formatPaymentMode(payment.paymentMode)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Quick Actions */}
                        <div>
                            <h2 className="text-lg font-semibold text-black mb-6">Quick Actions</h2>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => router.push('/members/add')}
                                    className="px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors font-medium"
                                >
                                    Add New Member
                                </button>
                                <button
                                    onClick={() => router.push('/members')}
                                    className="px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md transition-colors font-medium"
                                >
                                    View All Members
                                </button>
                                <button
                                    onClick={() => router.push('/plans')}
                                    className="px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md transition-colors font-medium"
                                >
                                    Manage Plans
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}

export default function DashboardPage() {
    return (
        <AuthGuard>
            <DashboardContent />
        </AuthGuard>
    );
}
