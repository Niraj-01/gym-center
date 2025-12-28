'use client';

/**
 * Member Profile Page - View individual member details
 */

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Member, getMemberStatus, getStatusDisplay } from '@/lib/types/member';
import { MemberAvatar } from '@/components/members/MemberAvatar';
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

            // Fetch member from Supabase
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

            // Convert snake_case to camelCase and date strings to Date objects
            const memberData: Member = {
                id: data.id,
                name: data.name,
                phone: data.phone,
                email: data.email,
                photoUrl: data.photo_url,
                joinDate: new Date(data.start_date), // Using start_date as joinDate
                planId: data.plan_id,
                planName: (data.plans as any)?.name || 'Unknown Plan',
                membershipStartDate: new Date(data.start_date),
                membershipExpiryDate: new Date(data.expiry_date),
                notes: data.notes,
                isActive: true, // Default value (column doesn't exist in DB)
                createdAt: new Date(data.created_at),
                updatedAt: new Date(data.created_at), // Using created_at (updated_at doesn't exist)
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
            <div className="flex items-center justify-center min-h-screen bg-white">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-black mx-auto mb-4"></div>
                    <p className="text-sm text-gray-500">Loading...</p>
                </div>
            </div>
        );
    }

    if (!member) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-white">
                <div className="text-center">
                    <p className="text-gray-600 mb-4">Member not found</p>
                    <button
                        onClick={() => router.push('/members')}
                        className="px-6 py-3 bg-black text-white hover:bg-gray-800 transition-colors font-medium"
                    >
                        Back to Members
                    </button>
                </div>
            </div>
        );
    }

    const status = getMemberStatus(member.membershipExpiryDate);
    const statusDisplay = getStatusDisplay(status);

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-4xl mx-auto px-6 py-6">
                    <button
                        onClick={() => router.push('/members')}
                        className="text-sm text-gray-600 hover:text-black transition-colors mb-4"
                    >
                        ← Back to Members
                    </button>
                    <div className="flex items-start justify-between">
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
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => router.push(`/members/${member.id}/payment`)}
                                className="px-6 py-2 bg-black text-white text-sm hover:bg-gray-800 transition-colors font-medium"
                            >
                                Record Payment
                            </button>
                            <button
                                onClick={() => router.push(`/members/${member.id}/payments`)}
                                className="px-6 py-2 border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Payment History
                            </button>
                            <button
                                onClick={() => router.push(`/members/${member.id}/edit`)}
                                className="px-6 py-2 border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Edit
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-6 py-8">
                {/* Status Badge */}
                <div className="mb-8">
                    <span className={`text-base font-medium ${statusDisplay.color}`}>
                        {statusDisplay.label}
                    </span>
                </div>

                {/* Basic Information */}
                <div className="border-b border-gray-200 pb-8 mb-8">
                    <h2 className="text-base font-semibold text-black mb-6">Basic Information</h2>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Full Name</p>
                            <p className="text-base text-black">{member.name}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Phone Number</p>
                            <p className="text-base text-black">{member.phone}</p>
                        </div>
                        {member.email && (
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Email</p>
                                <p className="text-base text-black">{member.email}</p>
                            </div>
                        )}
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Join Date</p>
                            <p className="text-base text-black">{formatDate(member.joinDate)}</p>
                        </div>
                    </div>
                </div>

                {/* Membership Details */}
                <div className="border-b border-gray-200 pb-8 mb-8">
                    <h2 className="text-base font-semibold text-black mb-6">Membership Details</h2>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Current Plan</p>
                            <p className="text-base text-black">{member.planName}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Status</p>
                            <p className={`text-base font-medium ${statusDisplay.color}`}>
                                {statusDisplay.label}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Start Date</p>
                            <p className="text-base text-black">{formatDate(member.membershipStartDate)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Expiry Date</p>
                            <p className="text-base text-black">{formatDate(member.membershipExpiryDate)}</p>
                        </div>
                    </div>
                </div>

                {/* Additional Information */}
                {member.notes && (
                    <div>
                        <h2 className="text-base font-semibold text-black mb-4">Notes</h2>
                        <p className="text-base text-gray-600 whitespace-pre-wrap">{member.notes}</p>
                    </div>
                )}
            </main>
        </div>
    );
}

export default function MemberProfilePage() {
    return (
        <AuthGuard>
            <MemberProfileContent />
        </AuthGuard>
    );
}
