'use client';

/**
 * Plans List Page - Manage membership plans
 * 
 * Phase 4: Replaced alert() with toast notifications, console with logger
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Plan } from '@/lib/types/plan';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/lib/hooks/useToast';
import { logger } from '@/lib/utils/logger';

const supabase = createClient();


function PlansListContent() {
    const router = useRouter();
    const toast = useToast();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [showInactive, setShowInactive] = useState(false);
    const [togglingId, setTogglingId] = useState<string | null>(null);

    useEffect(() => {
        loadPlans();
    }, []);

    const loadPlans = async () => {
        try {
            setLoading(true);

            const { data, error } = await supabase
                .from('plans')
                .select('*');

            if (error) {
                throw error;
            }

            const plansData: Plan[] = (data || []).map((p: { id: number; name: string; duration: number; price: number; description?: string; is_active: boolean; created_at: string; updated_at: string }) => ({
                id: String(p.id),
                name: p.name,
                duration: p.duration,
                price: p.price,
                description: p.description,
                isActive: p.is_active,
                createdAt: new Date(p.created_at),
                updatedAt: new Date(p.updated_at),
            }));

            setPlans(plansData);
        } catch (error) {
            logger.error('Error loading plans:', error);
            toast.error('Failed to load plans');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (id: string, currentStatus: boolean, name: string) => {
        const action = currentStatus ? 'disable' : 'enable';

        const { count, error: countError } = await supabase
            .from('members')
            .select('id', { count: 'exact', head: true })
            .eq('plan_id', id);

        const memberCount = count || 0;

        let confirmMessage = `${action === 'disable' ? 'Disable' : 'Enable'} plan "${name}"?`;
        if (action === 'disable' && memberCount > 0) {
            confirmMessage += `\n\nNote: ${memberCount} member(s) are currently on this plan. They will keep their membership, but this plan will be hidden from new member creation.`;
        }

        if (!confirm(confirmMessage)) {
            return;
        }

        try {
            setTogglingId(id);

            const { error } = await supabase
                .from('plans')
                .update({
                    is_active: !currentStatus,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id);

            if (error) {
                throw error;
            }

            await loadPlans();
            toast.success(`Plan "${name}" has been ${action}d`);
        } catch (error) {
            logger.error('Error toggling plan status:', error);
            toast.error('Failed to update plan status');
        } finally {
            setTogglingId(null);
        }
    };

    const formatPrice = (price: number) => {
        return `₹${price.toLocaleString('en-IN')}`;
    };

    const displayedPlans = showInactive
        ? plans
        : plans.filter(p => p.isActive);

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
                <PageHeader
                    title="Membership Plans"
                    description={`${plans.length} total plans (${plans.filter(p => p.isActive).length} active)`}
                    actionLabel="Create Plan"
                    onAction={() => router.push('/plans/add')}
                />

                {/* Show Inactive Toggle */}
                <div className="mb-6">
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer w-fit">
                        <input
                            type="checkbox"
                            checked={showInactive}
                            onChange={(e) => setShowInactive(e.target.checked)}
                            className="w-4 h-4 border-gray-300 rounded"
                        />
                        Show inactive plans
                    </label>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-black mx-auto mb-4"></div>
                        <p className="text-sm text-gray-500">Loading plans...</p>
                    </div>
                )}

                {/* Empty State */}
                {!loading && displayedPlans.length === 0 && (
                    <div className="text-center py-16 border border-gray-200 rounded-xl">
                        <p className="text-gray-500 mb-4">
                            {showInactive ? 'No plans yet' : 'No active plans'}
                        </p>
                        <button
                            onClick={() => router.push('/plans/add')}
                            className="px-6 py-3 bg-black text-white hover:bg-gray-800 rounded-lg transition-colors font-medium"
                        >
                            Add First Plan
                        </button>
                    </div>
                )}

                {/* Plans List */}
                {!loading && displayedPlans.length > 0 && (
                    <>
                        {/* Mobile Card View */}
                        <div className="block md:hidden space-y-4">
                            {displayedPlans.map((plan) => (
                                <div
                                    key={plan.id}
                                    className="bg-white border border-gray-200 rounded-xl p-4"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="font-semibold text-lg text-black">
                                                {plan.name}
                                            </h3>
                                            <p className="text-sm text-gray-500">
                                                {plan.duration} days
                                            </p>
                                            {plan.description && (
                                                <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                                            )}
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${plan.isActive
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {plan.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>

                                    <div className="mb-4">
                                        <p className="text-2xl font-bold text-black">
                                            {formatPrice(plan.price)}
                                        </p>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => router.push(`/plans/${plan.id}/edit`)}
                                            className="flex-1 px-4 py-2.5 bg-black text-white rounded-lg text-sm font-medium"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleToggleStatus(plan.id, plan.isActive, plan.name)}
                                            disabled={togglingId === plan.id}
                                            className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium disabled:opacity-50"
                                        >
                                            {togglingId === plan.id
                                                ? 'Updating...'
                                                : plan.isActive ? 'Disable' : 'Enable'
                                            }
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden md:block border border-gray-200 rounded-xl overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Plan Name</th>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Duration</th>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Price</th>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Status</th>
                                        <th className="px-6 py-4 text-right text-sm font-medium text-gray-700">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {displayedPlans.map((plan) => (
                                        <tr
                                            key={plan.id}
                                            className="hover:bg-gray-50 transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="text-sm font-medium text-black">{plan.name}</p>
                                                    {plan.description && (
                                                        <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {plan.duration} days
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {formatPrice(plan.price)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${plan.isActive
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {plan.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => router.push(`/plans/${plan.id}/edit`)}
                                                        className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
                                                        aria-label="Edit plan"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleStatus(plan.id, plan.isActive, plan.name)}
                                                        disabled={togglingId === plan.id}
                                                        className="px-3 py-1.5 text-sm text-gray-600 hover:text-black transition-colors disabled:opacity-50"
                                                    >
                                                        {togglingId === plan.id
                                                            ? 'Updating...'
                                                            : plan.isActive ? 'Disable' : 'Enable'
                                                        }
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </AdminLayout>
    );
}

export default function PlansListPage() {
    return (
        <AuthGuard>
            <PlansListContent />
        </AuthGuard>
    );
}
