'use client';

/**
 * Dashboard - Main analytics and stats view
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Payment } from '@/lib/types/payment';
import { getMemberStatus } from '@/lib/types/member';
import { GYM_NAME } from '@/lib/config';
import { createClient } from '@/lib/supabase/client';
const supabase = createClient();


// Local interface for dashboard stats
interface DashboardStats {
    totalMembers: number;
    activeMembers: number;
    dueSoonMembers: number;
    expiredMembers: number;
    thisMonthRevenue: number;
    totalRevenue: number;
}

function DashboardContent() {
    const router = useRouter();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);

            // Fetch all members with plans from Supabase
            const { data: membersData, error: membersError } = await supabase
                .from('members')
                .select(`
                    id, expiry_date
                `);

            // Fetch all payments from Supabase
            const { data: paymentsData, error: paymentsError } = await supabase
                .from('payments')
                .select('*')
                .order('payment_date', { ascending: false });

            // Fetch all members for lookup
            const { data: allMembersData } = await supabase
                .from('members')
                .select('id, name, phone');

            // Fetch all plans for lookup
            const { data: plansData } = await supabase
                .from('plans')
                .select('id, name');

            if (membersError || paymentsError) {
                throw membersError || paymentsError;
            }

            console.log('✅ Fetched members for dashboard:', membersData?.length);
            console.log('✅ Fetched payments:', paymentsData?.length);

            // Create lookup maps
            const memberMap = new Map((allMembersData || []).map((m: any) => [m.id, m]));
            const planMap = new Map((plansData || []).map((p: any) => [p.id, p]));

            // Calculate member stats
            const now = new Date();
            const thisMonth = now.getMonth();
            const thisYear = now.getFullYear();

            const memberStats = (membersData || []).reduce(
                (acc, member: any) => {
                    const status = getMemberStatus(new Date(member.expiry_date));
                    if (status === 'active') acc.active++;
                    else if (status === 'due-soon') acc.dueSoon++;
                    else acc.expired++;
                    return acc;
                },
                { active: 0, dueSoon: 0, expired: 0 }
            );

            // Convert payments with manual lookup for member and plan names
            const payments: Payment[] = (paymentsData || []).map((p: any) => {
                const member = memberMap.get(p.member_id);
                const plan = planMap.get(p.plan_id);
                return {
                    id: p.id,
                    memberId: p.member_id,
                    memberName: member?.name || 'Unknown',
                    memberPhone: member?.phone || '',
                    amount: p.amount,
                    paymentDate: new Date(p.payment_date),
                    paymentMode: p.mode || 'cash',
                    planId: p.plan_id,
                    planName: plan?.name || 'Unknown Plan',
                    notes: p.notes,
                };
            });

            // Calculate revenue
            const thisMonthRevenue = payments
                .filter(p => {
                    const date = p.paymentDate;
                    return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
                })
                .reduce((sum, p) => sum + p.amount, 0);

            const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

            // Set stats
            const statsData: DashboardStats = {
                totalMembers: (membersData || []).length,
                activeMembers: memberStats.active,
                dueSoonMembers: memberStats.dueSoon,
                expiredMembers: memberStats.expired,
                thisMonthRevenue,
                totalRevenue,
            };

            setStats(statsData);
            setRecentPayments(payments.slice(0, 10)); // Top 10 recent payments
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
        <AdminLayout>
            <div className="max-w-7xl mx-auto px-6 py-8">
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
                ) : (
                    <>
                        {/* Member Stats Cards */}
                        <div className="mb-8">
                            <h2 className="text-lg font-medium text-black mb-6">Member Statistics</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* Total Members */}
                                <div className="p-6 border border-gray-200 rounded-xl">
                                    <p className="text-sm text-gray-500">Total Members</p>
                                    <p className="text-3xl font-semibold text-black mt-2">
                                        {stats?.totalMembers || 0}
                                    </p>
                                </div>

                                {/* Active Members */}
                                <div className="p-6 border border-gray-200 rounded-xl">
                                    <p className="text-sm text-gray-500">Active</p>
                                    <p className="text-3xl font-semibold text-green-600 mt-2">
                                        {stats?.activeMembers || 0}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">7+ days remaining</p>
                                </div>

                                {/* Expiring Soon */}
                                <div className="p-6 border border-gray-200 rounded-xl">
                                    <p className="text-sm text-gray-500">Expiring Soon</p>
                                    <p className="text-3xl font-semibold text-yellow-600 mt-2">
                                        {stats?.dueSoonMembers || 0}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">Within 7 days</p>
                                </div>

                                {/* Expired */}
                                <div className="p-6 border border-gray-200 rounded-xl">
                                    <p className="text-sm text-gray-500">Expired</p>
                                    <p className="text-3xl font-semibold text-red-600 mt-2">
                                        {stats?.expiredMembers || 0}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">Need renewal</p>
                                </div>
                            </div>
                        </div>

                        {/* Revenue Cards */}
                        <div className="mb-8">
                            <h2 className="text-lg font-medium text-black mb-6">Revenue</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* This Month Revenue */}
                                <div className="p-6 border border-gray-200 rounded-xl">
                                    <p className="text-sm text-gray-500">This Month</p>
                                    <p className="text-3xl font-semibold text-black mt-2">
                                        {formatCurrency(stats?.thisMonthRevenue || 0)}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">{getCurrentMonth()}</p>
                                </div>

                                {/* Total Revenue */}
                                <div className="p-6 border border-gray-200 rounded-xl">
                                    <p className="text-sm text-gray-500">Total Revenue</p>
                                    <p className="text-3xl font-semibold text-black mt-2">
                                        {formatCurrency(stats?.totalRevenue || 0)}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">All time</p>
                                </div>
                            </div>
                        </div>

                        {/* Recent Payments */}
                        {recentPayments.length > 0 && (
                            <div className="mb-8">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-lg font-medium text-black">Recent Payments</h2>
                                    <button
                                        onClick={() => router.push('/members')}
                                        className="text-sm text-gray-600 hover:text-black transition-colors"
                                    >
                                        View all →
                                    </button>
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
                                            {recentPayments.map((payment) => (
                                                <tr
                                                    key={payment.id}
                                                    onClick={() => router.push(`/members/${payment.memberId}`)}
                                                    className="hover:bg-gray-50 transition-colors cursor-pointer"
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
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile: Cards */}
                                <div className="md:hidden space-y-3">
                                    {recentPayments.map((payment) => (
                                        <div
                                            key={payment.id}
                                            onClick={() => router.push(`/members/${payment.memberId}`)}
                                            className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
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
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Quick Actions */}
                        <div>
                            <h2 className="text-lg font-medium text-black mb-6">Quick Actions</h2>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                <button
                                    onClick={() => router.push('/members/add')}
                                    className="w-full sm:w-auto px-6 py-3 bg-black text-white hover:bg-gray-800 rounded-lg transition-colors font-medium text-sm"
                                >
                                    Add New Member
                                </button>
                                <button
                                    onClick={() => router.push('/members')}
                                    className="w-full sm:w-auto px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors font-medium text-sm"
                                >
                                    View All Members
                                </button>
                                <button
                                    onClick={() => router.push('/plans')}
                                    className="w-full sm:w-auto px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors font-medium text-sm"
                                >
                                    Manage Plans
                                </button>
                            </div>
                        </div>
                    </>
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
