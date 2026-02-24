'use client';

/**
 * Edit Plan Form - Update existing membership plan
 * 
 * Phase 4: Replaced alert() with toast notifications, console with logger
 */

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Plan, PlanFormData } from '@/lib/types/plan';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/lib/hooks/useToast';
import { logger } from '@/lib/utils/logger';

const supabase = createClient();


function EditPlanFormContent() {
    const router = useRouter();
    const params = useParams();
    const planId = params.id as string;
    const toast = useToast();

    const [plan, setPlan] = useState<Plan | null>(null);
    const [memberCount, setMemberCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState<Partial<PlanFormData>>({});

    useEffect(() => {
        loadData();
    }, [planId]);

    const loadData = async () => {
        try {
            setLoading(true);

            // Fetch plan from Supabase
            const { data: planResult, error: planError } = await supabase
                .from('plans')
                .select('*')
                .eq('id', planId)
                .single();

            // Get member count for this plan
            const { count, error: countError } = await supabase
                .from('members')
                .select('id', { count: 'exact', head: true })
                .eq('plan_id', planId);

            if (planError || !planResult) {
                toast.error('Plan not found');
                router.push('/plans');
                return;
            }

            // Convert from snake_case to camelCase
            const planData: Plan = {
                id: planResult.id,
                name: planResult.name,
                duration: planResult.duration_days,
                price: planResult.price,
                description: planResult.description,
                isActive: planResult.is_active,
                createdAt: new Date(planResult.created_at),
                updatedAt: new Date(planResult.updated_at),
            };

            setPlan(planData);
            setMemberCount(count || 0);

            setFormData({
                name: planData.name,
                duration: planData.duration,
                price: planData.price,
                description: planData.description || '',
            });
        } catch (error) {
            logger.error('Error loading plan:', error);
            toast.error('Failed to load plan data');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.duration || !formData.price) {
            toast.warning('Please fill in all required fields');
            return;
        }

        if (formData.name.length < 3 || formData.name.length > 50) {
            toast.warning('Plan name must be between 3 and 50 characters');
            return;
        }

        if (formData.duration < 1 || formData.duration > 365) {
            toast.warning('Duration must be between 1 and 365 days');
            return;
        }

        if (formData.price <= 0) {
            toast.warning('Price must be greater than 0');
            return;
        }

        try {
            setSubmitting(true);

            // Update plan in Supabase
            const { error } = await supabase
                .from('plans')
                .update({
                    name: formData.name,
                    duration_days: formData.duration,
                    price: formData.price,
                    description: formData.description || null,
                })
                .eq('id', planId);

            if (error) {
                throw error;
            }

            router.push('/plans');
            toast.success('Plan updated successfully');
        } catch (error) {
            logger.error('Error updating plan:', error);
            const errorMessage = error instanceof Error
                ? error.message
                : 'Unknown error occurred';
            toast.error(`Failed to update plan: ${errorMessage}`);
        } finally {
            setSubmitting(false);
        }
    };

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

    if (!plan) {
        return null;
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-3xl mx-auto px-6 py-6">
                    <button
                        onClick={() => router.push('/plans')}
                        className="text-sm text-gray-600 hover:text-black transition-colors mb-4"
                    >
                        ← Back to Plans
                    </button>
                    <h1 className="text-2xl font-semibold text-black">Edit Plan</h1>
                    {memberCount > 0 && (
                        <p className="text-sm text-gray-500 mt-2">
                            {memberCount} member{memberCount > 1 ? 's are' : ' is'} currently using this plan
                        </p>
                    )}
                </div>
            </header>

            {/* Form */}
            <main className="max-w-3xl mx-auto px-6 py-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Member Count Warning */}
                    {memberCount > 0 && (
                        <div className="p-4 border border-gray-200 bg-gray-50">
                            <p className="text-sm text-gray-700">
                                <span className="font-medium">Note:</span> Changes to this plan will not affect existing members.
                                They will keep their current membership duration and pricing.
                            </p>
                        </div>
                    )}

                    {/* Plan Details */}
                    <div className="border-b border-gray-200 pb-8">
                        <h2 className="text-base font-semibold text-black mb-6">Plan Details</h2>

                        <div className="space-y-6">
                            {/* Plan Name */}
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-black mb-2">
                                    Plan Name *
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    required
                                    minLength={3}
                                    maxLength={50}
                                    value={formData.name || ''}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 text-black focus:outline-none focus:border-black transition-colors"
                                />
                                <p className="mt-2 text-sm text-gray-500">
                                    3-50 characters
                                </p>
                            </div>

                            {/* Duration */}
                            <div>
                                <label htmlFor="duration" className="block text-sm font-medium text-black mb-2">
                                    Duration (Days) *
                                </label>
                                <input
                                    type="number"
                                    id="duration"
                                    required
                                    min={1}
                                    max={365}
                                    value={formData.duration || 0}
                                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                                    className="w-full px-4 py-3 border border-gray-300 text-black focus:outline-none focus:border-black transition-colors"
                                />
                                <p className="mt-2 text-sm text-gray-500">
                                    How many days this plan is valid (1-365)
                                </p>
                            </div>

                            {/* Price */}
                            <div>
                                <label htmlFor="price" className="block text-sm font-medium text-black mb-2">
                                    Price (₹) *
                                </label>
                                <input
                                    type="number"
                                    id="price"
                                    required
                                    min={1}
                                    value={formData.price || 0}
                                    onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                                    className="w-full px-4 py-3 border border-gray-300 text-black focus:outline-none focus:border-black transition-colors"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-black mb-2">
                                    Description (Optional)
                                </label>
                                <textarea
                                    id="description"
                                    rows={4}
                                    maxLength={500}
                                    value={formData.description || ''}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 text-black focus:outline-none focus:border-black transition-colors resize-none"
                                />
                                <p className="mt-2 text-sm text-gray-500">
                                    Max 500 characters
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-4 pt-6 border-t border-gray-200">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-8 py-3 bg-black text-white hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? 'Saving Changes...' : 'Save Changes'}
                        </button>
                        <button
                            type="button"
                            onClick={() => router.push('/plans')}
                            disabled={submitting}
                            className="px-8 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}

export default function EditPlanPage() {
    return (
        <AuthGuard>
            <EditPlanFormContent />
        </AuthGuard>
    );
}
