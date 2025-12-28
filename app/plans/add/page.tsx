'use client';

/**
 * Add Plan Form - Create new membership plan
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { PlanFormData } from '@/lib/types/plan';
import { createClient } from '@/lib/supabase/client';
const supabase = createClient();


function AddPlanFormContent() {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState<PlanFormData>({
        name: '',
        duration: 30,
        price: 0,
        description: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || formData.duration <= 0 || formData.price <= 0) {
            alert('Please fill in all required fields with valid values');
            return;
        }

        if (formData.name.length < 3 || formData.name.length > 50) {
            alert('Plan name must be between 3 and 50 characters');
            return;
        }

        if (formData.duration < 1 || formData.duration > 365) {
            alert('Duration must be between 1 and 365 days');
            return;
        }

        try {
            setSubmitting(true);

            // Insert plan into Supabase
            const { error } = await supabase
                .from('plans')
                .insert({
                    name: formData.name,
                    duration: formData.duration,
                    price: formData.price,
                    description: formData.description || null,
                    is_active: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                });

            if (error) {
                throw error;
            }

            router.push('/plans');
        } catch (error) {
            console.error('Error creating plan:', error);
            const errorMessage = error instanceof Error
                ? error.message
                : 'Unknown error occurred';
            alert(`Failed to create plan: ${errorMessage}`);
        } finally {
            setSubmitting(false);
        }
    };

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
                    <h1 className="text-2xl font-semibold text-black">Add New Plan</h1>
                </div>
            </header>

            {/* Form */}
            <main className="max-w-3xl mx-auto px-6 py-8">
                <form onSubmit={handleSubmit} className="space-y-8">
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
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 text-black focus:outline-none focus:border-black transition-colors"
                                    placeholder="e.g., Monthly Gym, Annual Membership"
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
                                    value={formData.duration}
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
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                                    className="w-full px-4 py-3 border border-gray-300 text-black focus:outline-none focus:border-black transition-colors"
                                    placeholder="e.g., 1500"
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
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 text-black focus:outline-none focus:border-black transition-colors resize-none"
                                    placeholder="Brief description of what's included in this plan..."
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
                            {submitting ? 'Adding Plan...' : 'Add Plan'}
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

export default function AddPlanPage() {
    return (
        <AuthGuard>
            <AddPlanFormContent />
        </AuthGuard>
    );
}
