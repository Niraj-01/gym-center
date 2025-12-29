'use client';

/**
 * Plans List Page - Manage membership plans
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useAuth } from '@/contexts/AuthContext';
import { Plan } from '@/lib/types/plan';
import { createClient } from '@/lib/supabase/client';
const supabase = createClient();


function PlansListContent() {
    const router = useRouter();
    const { signOut } = useAuth();
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

            // Fetch all plans from Supabase
            const { data, error } = await supabase
                .from('plans')
                .select('*');

            if (error) {
                throw error;
            }

            // Convert from snake_case to camelCase
            const plansData: Plan[] = (data || []).map((p: any) => ({
                id: p.id,
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
            console.error('Error loading plans:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (id: string, currentStatus: boolean, name: string) => {
        const action = currentStatus ? 'disable' : 'enable';

        // Get member count for this plan
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

            // Toggle plan status in Supabase
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
        } catch (error) {
            console.error('Error toggling plan status:', error);
            alert('Failed to update plan status');
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
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <img src="/logo.png" alt="GymCentre" className="h-6 sm:h-8" />
                            <div>
                                <h1 className="text-xl sm:text-2xl font-semibold text-black">GymCentre</h1>
                                <p className="text-sm text-gray-500 mt-1">Plans Management</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-4">
                            <button
                                onClick={() => router.push('/dashboard')}
                                className="flex-1 sm:flex-none px-4 py-2 text-sm text-gray-700 hover:text-black transition-colors"
                            >
                                Dashboard
                            </button>
                            <button
                                onClick={() => router.push('/members')}
                                className="flex-1 sm:flex-none px-4 py-2 text-sm text-gray-700 hover:text-black transition-colors"
                            >
                                Members
                            </button>
                            <button
                                onClick={() => signOut()}
                                className="flex-1 sm:flex-none px-4 sm:px-6 py-2 border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8 pb-6 border-b border-gray-200">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-semibold text-black">Membership Plans</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {plans.length} total plans ({plans.filter(p => p.isActive).length} active)
                        </p>
                    </div>
                    <button
                        onClick={() => router.push('/plans/add')}
                        className="w-full sm:w-auto px-6 py-3 bg-black text-white hover:bg-gray-800 transition-colors font-medium"
                    >
                        Add Plan
                    </button>
                </div>

                {/* Show Inactive Toggle */}
                <div className="mb-6">
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer w-fit">
                        <input
                            type="checkbox"
                            checked={showInactive}
                            onChange={(e) => setShowInactive(e.target.checked)}
                            className="w-4 h-4 border-gray-300"
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
                    <div className="text-center py-16 border border-gray-200">
                        <p className="text-gray-500 mb-4">
                            {showInactive ? 'No plans yet' : 'No active plans'}
                        </p>
                        <button
                            onClick={() => router.push('/plans/add')}
                            className="px-6 py-3 bg-black text-white hover:bg-gray-800 transition-colors font-medium"
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
                                    className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
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
                        <div className="hidden md:block border border-gray-200">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-black">Plan Name</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-black">Duration</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-black">Price</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-black">Status</th>
                                        <th className="px-6 py-4 text-right text-sm font-semibold text-black">Actions</th>
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
                                                <span
                                                    className={`text-sm font-medium ${plan.isActive ? 'text-gray-900' : 'text-gray-400'
                                                        }`}
                                                >
                                                    {plan.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => router.push(`/plans/${plan.id}/edit`)}
                                                        className="px-4 py-2 text-sm text-gray-700 hover:text-black transition-colors"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleStatus(plan.id, plan.isActive, plan.name)}
                                                        disabled={togglingId === plan.id}
                                                        className="px-4 py-2 text-sm text-gray-500 hover:text-black transition-colors disabled:opacity-50"
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
            </main>
        </div>
    );
}

export default function PlansListPage() {
    return (
        <AuthGuard>
            <PlansListContent />
        </AuthGuard>
    );
}
