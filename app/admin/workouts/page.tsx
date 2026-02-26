'use client';

/**
 * Admin Workout Plans — List, create, and manage workout plans
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { WorkoutPlan, WorkoutPlanFormData } from '@/lib/types/workout';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

function WorkoutPlansContent() {
    const router = useRouter();
    const { user } = useAuth();
    const [plans, setPlans] = useState<WorkoutPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [creating, setCreating] = useState(false);
    const [formData, setFormData] = useState<WorkoutPlanFormData>({ name: '', description: '' });

    useEffect(() => {
        loadPlans();
    }, []);

    const loadPlans = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('workout_plans')
                .select(`
                    *,
                    workout_days(count)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const plansData: WorkoutPlan[] = (data || []).map((p: Record<string, unknown>) => ({
                id: String(p.id),
                name: p.name as string,
                description: (p.description as string) || '',
                created_by: p.created_by as string,
                is_active: p.is_active as boolean,
                created_at: p.created_at as string,
                updated_at: p.updated_at as string,
                day_count: Array.isArray(p.workout_days) ? p.workout_days.length : ((p.workout_days as { count: number })?.count || 0),
            }));

            setPlans(plansData);
        } catch (err) {
            console.error('Error loading workout plans:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim() || !user?.email) return;

        try {
            setCreating(true);
            const { error } = await supabase
                .from('workout_plans')
                .insert({
                    name: formData.name.trim(),
                    description: formData.description.trim(),
                    created_by: user.email,
                });

            if (error) throw error;

            setFormData({ name: '', description: '' });
            setShowCreateForm(false);
            await loadPlans();
        } catch (err) {
            console.error('Error creating workout plan:', err);
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (planId: string, planName: string) => {
        if (!confirm(`Delete workout plan "${planName}"? This will remove all associated days and exercises.`)) return;

        try {
            const { error } = await supabase
                .from('workout_plans')
                .delete()
                .eq('id', planId);

            if (error) throw error;
            await loadPlans();
        } catch (err) {
            console.error('Error deleting plan:', err);
        }
    };

    return (
        <AdminLayout>
            <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-black">Workout Plans</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Create and manage workout programs for your members
                        </p>
                    </div>
                    <button
                        onClick={() => setShowCreateForm(!showCreateForm)}
                        className="px-5 py-2.5 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors text-sm flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        New Plan
                    </button>
                </div>

                {/* Create Form */}
                {showCreateForm && (
                    <div className="mb-8 border border-gray-200 rounded-xl p-6 bg-gray-50">
                        <h3 className="text-base font-semibold text-black mb-4">Create New Workout Plan</h3>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Plan Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-black focus:outline-none focus:border-black transition-colors"
                                    placeholder="e.g. Beginner Strength Program"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-black focus:outline-none focus:border-black transition-colors resize-none"
                                    rows={3}
                                    placeholder="Describe the workout program..."
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="px-6 py-2.5 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors text-sm"
                                >
                                    {creating ? 'Creating...' : 'Create Plan'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowCreateForm(false)}
                                    className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Loading */}
                {loading && (
                    <div className="text-center py-16">
                        <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-black mx-auto mb-4"></div>
                        <p className="text-sm text-gray-500">Loading workout plans...</p>
                    </div>
                )}

                {/* Empty State */}
                {!loading && plans.length === 0 && (
                    <div className="text-center py-16 border border-dashed border-gray-300 rounded-xl">
                        <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                        <p className="text-gray-500 mb-4">No workout plans yet</p>
                        <button
                            onClick={() => setShowCreateForm(true)}
                            className="px-6 py-2.5 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors text-sm"
                        >
                            Create First Plan
                        </button>
                    </div>
                )}

                {/* Plans Grid */}
                {!loading && plans.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {plans.map((plan) => (
                            <div
                                key={plan.id}
                                className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow bg-white group"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-base font-semibold text-black truncate">{plan.name}</h3>
                                        {plan.description && (
                                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{plan.description}</p>
                                        )}
                                    </div>
                                    <span className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${plan.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                        {plan.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>

                                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                                    <span className="flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        {plan.day_count || 0} days
                                    </span>
                                    <span className="text-xs text-gray-400">
                                        by {plan.created_by?.split('@')[0]}
                                    </span>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => router.push(`/admin/workouts/${plan.id}`)}
                                        className="flex-1 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                                    >
                                        Edit Plan
                                    </button>
                                    <button
                                        onClick={() => handleDelete(plan.id, plan.name)}
                                        className="px-3 py-2 border border-gray-300 text-gray-500 rounded-lg text-sm hover:text-red-600 hover:border-red-300 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}

export default function WorkoutPlansPage() {
    return (
        <AuthGuard>
            <WorkoutPlansContent />
        </AuthGuard>
    );
}
