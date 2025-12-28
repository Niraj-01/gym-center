'use client';

/**
 * Edit Member Form - Update existing member
 */

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Member, MemberFormData } from '@/lib/types/member';
import { Plan } from '@/lib/types/plan';
import { createClient } from '@/lib/supabase/client';
const supabase = createClient();


function EditMemberFormContent() {
    const router = useRouter();
    const params = useParams();
    const memberId = params.id as string;

    const [member, setMember] = useState<Member | null>(null);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState<Partial<MemberFormData>>({});

    useEffect(() => {
        loadData();
    }, [memberId]);

    const loadData = async () => {
        try {
            setLoading(true);

            // Fetch member from Supabase - using CORRECT column names
            const { data: memberResult, error: memberError } = await supabase
                .from('members')
                .select(`
                    id, name, email, phone, photo_url, plan_id,
                    start_date, expiry_date, created_at,
                    plans (id, name, price, duration_days)
                `)
                .eq('id', memberId)
                .single();

            // Fetch active plans from Supabase
            const { data: plansResult, error: plansError } = await supabase
                .from('plans')
                .select('*')
                .eq('is_active', true);

            if (memberError || !memberResult) {
                console.error('❌ Error loading member:', memberError);
                alert('Member not found');
                router.push('/members');
                return;
            }

            console.log('✅ Loaded member:', memberResult.name);

            // Convert from snake_case to camelCase - using CORRECT column names
            const memberData: Member = {
                id: memberResult.id,
                name: memberResult.name,
                phone: memberResult.phone,
                email: memberResult.email,
                photoUrl: memberResult.photo_url,
                joinDate: memberResult.start_date ? new Date(memberResult.start_date) : new Date(),
                planId: memberResult.plan_id,
                planName: (memberResult.plans as any)?.name || 'Unknown',
                membershipStartDate: memberResult.start_date ? new Date(memberResult.start_date) : new Date(),
                membershipExpiryDate: memberResult.expiry_date ? new Date(memberResult.expiry_date) : new Date(),
                notes: '',
                isActive: true,
                createdAt: memberResult.created_at ? new Date(memberResult.created_at) : new Date(),
                updatedAt: memberResult.created_at ? new Date(memberResult.created_at) : new Date(),
            };

            // Map plans with correct column names
            const plansData: Plan[] = (plansResult || []).map((p: any) => ({
                id: p.id,
                name: p.name,
                duration: p.duration_days, // Map duration_days to duration
                price: p.price,
                description: p.description,
                isActive: p.is_active,
                createdAt: p.created_at ? new Date(p.created_at) : new Date(),
                updatedAt: p.created_at ? new Date(p.created_at) : new Date(),
            }));

            setMember(memberData);
            setPlans(plansData);

            // Initialize form with existing data
            setFormData({
                name: memberData.name,
                phone: memberData.phone,
                email: memberData.email || '',
                joinDate: memberData.joinDate,
                planId: memberData.planId,
                membershipStartDate: memberData.membershipStartDate,
                notes: memberData.notes || '',
            });
        } catch (error) {
            console.error('Error loading data:', error);
            alert('Failed to load member data');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.phone || !formData.planId) {
            alert('Please fill in all required fields');
            return;
        }

        try {
            setSubmitting(true);

            // Get selected plan to calculate new expiry if plan or start date changed
            const selectedPlan = plans.find(p => p.id === formData.planId);
            let membershipExpiryDate = member?.membershipExpiryDate;

            if (selectedPlan && formData.membershipStartDate) {
                // Plan or start date changed - recalculate expiry
                if (formData.planId !== member?.planId ||
                    formData.membershipStartDate.getTime() !== member?.membershipStartDate.getTime()) {
                    const expiryDate = new Date(formData.membershipStartDate);
                    expiryDate.setDate(expiryDate.getDate() + selectedPlan.duration);
                    membershipExpiryDate = expiryDate;
                }
            }

            // Update member in Supabase - using CORRECT column names
            const { error } = await supabase
                .from('members')
                .update({
                    name: formData.name,
                    phone: formData.phone,
                    email: formData.email || null,
                    photo_url: formData.photoUrl || null,
                    plan_id: formData.planId,
                    start_date: formData.membershipStartDate?.toISOString().split('T')[0], // YYYY-MM-DD
                    expiry_date: membershipExpiryDate?.toISOString().split('T')[0], // YYYY-MM-DD
                })
                .eq('id', memberId);

            if (error) {
                throw error;
            }

            router.push(`/members/${memberId}`);
        } catch (error) {
            console.error('Error updating member:', error);
            const errorMessage = error instanceof Error
                ? error.message
                : 'Unknown error occurred';
            alert(`Failed to update member: ${errorMessage}`);
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

    if (!member) {
        return null;
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-3xl mx-auto px-6 py-6">
                    <button
                        onClick={() => router.push(`/members/${memberId}`)}
                        className="text-sm text-gray-600 hover:text-black transition-colors mb-4"
                    >
                        ← Back to Profile
                    </button>
                    <h1 className="text-2xl font-semibold text-black">Edit Member</h1>
                </div>
            </header>

            {/* Form */}
            <main className="max-w-3xl mx-auto px-6 py-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Basic Information */}
                    <div className="border-b border-gray-200 pb-8">
                        <h2 className="text-base font-semibold text-black mb-6">Basic Information</h2>

                        <div className="space-y-6">
                            {/* Name */}
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-black mb-2">
                                    Full Name *
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    required
                                    value={formData.name || ''}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 text-black focus:outline-none focus:border-black transition-colors"
                                />
                            </div>

                            {/* Phone */}
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-black mb-2">
                                    Phone Number *
                                </label>
                                <input
                                    type="tel"
                                    id="phone"
                                    required
                                    value={formData.phone || ''}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 text-black focus:outline-none focus:border-black transition-colors"
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-black mb-2">
                                    Email (Optional)
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    value={formData.email || ''}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 text-black focus:outline-none focus:border-black transition-colors"
                                />
                            </div>

                            {/* Photo URL */}
                            <div>
                                <label htmlFor="photoUrl" className="block text-sm font-medium text-black mb-2">
                                    Photo URL (Optional)
                                </label>
                                <input
                                    type="url"
                                    id="photoUrl"
                                    value={formData.photoUrl || ''}
                                    onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 text-black focus:outline-none focus:border-black transition-colors"
                                    placeholder="https://example.com/photo.jpg"
                                />
                                <p className="mt-2 text-sm text-gray-500">
                                    Enter a URL to a profile photo. Leave empty for default avatar.
                                </p>
                            </div>

                            {/* Join Date */}
                            <div>
                                <label htmlFor="joinDate" className="block text-sm font-medium text-black mb-2">
                                    Join Date *
                                </label>
                                <input
                                    type="date"
                                    id="joinDate"
                                    required
                                    value={formData.joinDate ? formData.joinDate.toISOString().split('T')[0] : ''}
                                    onChange={(e) => setFormData({ ...formData, joinDate: new Date(e.target.value) })}
                                    className="w-full px-4 py-3 border border-gray-300 text-black focus:outline-none focus:border-black transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Membership Details */}
                    <div className="border-b border-gray-200 pb-8">
                        <h2 className="text-base font-semibold text-black mb-6">Membership Details</h2>

                        <div className="space-y-6">
                            {/* Plan */}
                            <div>
                                <label htmlFor="plan" className="block text-sm font-medium text-black mb-2">
                                    Membership Plan *
                                </label>
                                <select
                                    id="plan"
                                    required
                                    value={formData.planId || ''}
                                    onChange={(e) => setFormData({ ...formData, planId: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 text-black focus:outline-none focus:border-black transition-colors"
                                >
                                    {plans.map((plan) => (
                                        <option key={plan.id} value={plan.id}>
                                            {plan.name} - ₹{plan.price} ({plan.duration} days)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Membership Start Date */}
                            <div>
                                <label htmlFor="startDate" className="block text-sm font-medium text-black mb-2">
                                    Membership Start Date *
                                </label>
                                <input
                                    type="date"
                                    id="startDate"
                                    required
                                    value={formData.membershipStartDate ? formData.membershipStartDate.toISOString().split('T')[0] : ''}
                                    onChange={(e) => setFormData({ ...formData, membershipStartDate: new Date(e.target.value) })}
                                    className="w-full px-4 py-3 border border-gray-300 text-black focus:outline-none focus:border-black transition-colors"
                                />
                            </div>

                            {/* Note about changing plan/dates */}
                            <div className="p-4 bg-gray-50 border border-gray-200">
                                <p className="text-sm text-gray-600">
                                    Changing the plan or start date will automatically recalculate the expiry date.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Additional Information */}
                    <div className="pb-8">
                        <h2 className="text-base font-semibold text-black mb-6">Additional Information</h2>

                        <div>
                            <label htmlFor="notes" className="block text-sm font-medium text-black mb-2">
                                Notes (Optional)
                            </label>
                            <textarea
                                id="notes"
                                rows={4}
                                value={formData.notes || ''}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 text-black focus:outline-none focus:border-black transition-colors resize-none"
                            />
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
                            onClick={() => router.push(`/members/${memberId}`)}
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

export default function EditMemberPage() {
    return (
        <AuthGuard>
            <EditMemberFormContent />
        </AuthGuard>
    );
}
