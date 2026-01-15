'use client';

/**
 * Member Profile Page - View individual member details
 */

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Member, getMemberStatus } from '@/lib/types/member';
import { MemberAvatar } from '@/components/members/MemberAvatar';
import { StatusBadge } from '@/components/members/StatusBadge';
import { createClient } from '@/lib/supabase/client';
const supabase = createClient();


function MemberProfileContent() {
    const router = useRouter();
    const params = useParams();
    const memberId = params.id as string;

    const [member, setMember] = useState<Member | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadMember();
    }, [memberId]);

    const loadMember = async () => {
        try {
            setLoading(true);

            const { data, error } = await supabase
                .from('members')
                .select(`
                    id,
                    name,
                    email,
                    phone,
                    photo_url,
                    start_date,
                    plan_id,
                    expiry_date,
                    notes,
                    created_at,
                    plans (
                        id,
                        name,
                        price,
                        duration_days
                    )
                `)
                .eq('id', memberId)
                .single();

            if (error || !data) {
                console.error('Error loading member:', error);
                setMember(null);
                return;
            }

            const memberData: Member = {
                id: data.id,
                name: data.name,
                phone: data.phone,
                email: data.email,
                photoUrl: data.photo_url,
                joinDate: new Date(data.start_date),
                planId: data.plan_id,
                planName: (data.plans as any)?.name || 'Unknown Plan',
                membershipStartDate: new Date(data.start_date),
                membershipExpiryDate: new Date(data.expiry_date),
                notes: data.notes,
                isActive: true,
                createdAt: new Date(data.created_at),
                updatedAt: new Date(data.created_at),
            };

            setMember(memberData);
        } catch (error) {
            console.error('Error loading member:', error);
            setMember(null);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        }).format(date);
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-black mx-auto mb-4"></div>
                        <p className="text-sm text-gray-500">Loading...</p>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    if (!member) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <p className="text-gray-600 mb-4">Member not found</p>
                        <button
                            onClick={() => router.push('/members')}
                            className="px-6 py-3 bg-black text-white hover:bg-gray-800 rounded-lg transition-colors font-medium"
                        >
                            Back to Members
                        </button>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    const status = getMemberStatus(member.membershipExpiryDate);

    return (
        <AdminLayout>
            <div className="max-w-4xl mx-auto px-6 py-8">
                {/* Back Link */}
                <button
                    onClick={() => router.push('/members')}
                    className="text-sm text-gray-600 hover:text-black transition-colors mb-6 flex items-center gap-1"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Members
                </button>

                {/* Member Header */}
                <div className="flex items-start justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <MemberAvatar
                            name={member.name}
                            photoUrl={member.photoUrl}
                            size="lg"
                        />
                        <div>
                            <h1 className="text-2xl font-semibold text-black">{member.name}</h1>
                            <p className="text-sm text-gray-500 mt-1">{member.phone}</p>
                        </div>
                    </div>
                    <StatusBadge status={status} />
                </div>

                {/* Cards Grid */}
                <div className="space-y-6">
                    {/* Member Info Card */}
                    <div className="border border-gray-200 rounded-xl p-6">
                        <h2 className="text-lg font-medium text-black mb-4">Member Information</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Full Name</p>
                                <p className="text-sm text-black font-medium">{member.name}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Phone Number</p>
                                <p className="text-sm text-black font-medium">{member.phone}</p>
                            </div>
                            {member.email && (
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Email</p>
                                    <p className="text-sm text-black font-medium">{member.email}</p>
                                </div>
                            )}
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Join Date</p>
                                <p className="text-sm text-black font-medium">{formatDate(member.joinDate)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Membership Details Card */}
                    <div className="border border-gray-200 rounded-xl p-6">
                        <h2 className="text-lg font-medium text-black mb-4">Membership Details</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Current Plan</p>
                                <p className="text-sm text-black font-medium">{member.planName}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Status</p>
                                <div className="mt-0.5">
                                    <StatusBadge status={status} size="sm" />
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Start Date</p>
                                <p className="text-sm text-black font-medium">{formatDate(member.membershipStartDate)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Expiry Date</p>
                                <p className="text-sm text-black font-medium">{formatDate(member.membershipExpiryDate)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Notes Card */}
                    {member.notes && (
                        <div className="border border-gray-200 rounded-xl p-6">
                            <h2 className="text-lg font-medium text-black mb-4">Notes</h2>
                            <p className="text-sm text-gray-600 whitespace-pre-wrap">{member.notes}</p>
                        </div>
                    )}

                    {/* Actions Card */}
                    <div className="border border-gray-200 rounded-xl p-6">
                        <h2 className="text-lg font-medium text-black mb-4">Actions</h2>
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={() => router.push(`/members/${member.id}/payment`)}
                                className="px-6 py-2.5 bg-black text-white hover:bg-gray-800 rounded-lg transition-colors font-medium text-sm"
                            >
                                Record Payment
                            </button>
                            <button
                                onClick={() => router.push(`/members/${member.id}/payments`)}
                                className="px-6 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors font-medium text-sm"
                            >
                                Payment History
                            </button>
                            <button
                                onClick={() => router.push(`/members/${member.id}/edit`)}
                                className="px-6 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors font-medium text-sm"
                            >
                                Edit Member
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

export default function MemberProfilePage() {
    return (
        <AuthGuard>
            <MemberProfileContent />
        </AuthGuard>
    );
}
