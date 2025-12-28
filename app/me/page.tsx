'use client';

/**
 * Member Dashboard (/me) - Read-only view for gym members
 * Shows only logged-in member's own membership details
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MemberGuard } from '@/components/auth/MemberGuard';
import { useAuth } from '@/contexts/AuthContext';
import { Member, getMemberStatus, getStatusDisplay } from '@/lib/types/member';
import { GYM_NAME, PRODUCT_NAME } from '@/lib/config';
import { MemberAvatar } from '@/components/members/MemberAvatar';
import { createClient } from '@/lib/supabase/client';
const supabase = createClient();


function MemberDashboardContent() {
    const router = useRouter();
    const { user, signOut } = useAuth();
    const [member, setMember] = useState<Member | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.email) {
            loadMemberData(user.email);
        }
    }, [user]);

    const loadMemberData = async (email: string) => {
        try {
            setLoading(true);

            // Fetch member from Supabase by email
            const { data, error } = await supabase
                .from('members')
                .select(`
                    id, name, email, phone, photo_url, join_date, plan_id,
                    membership_start_date, membership_expiry_date, notes,
                    is_active, created_at, updated_at,
                    plans (id, name, price, duration)
                `)
                .eq('email', email)
                .single();

            if (error || !data) {
                console.error('Error loading member data:', error);
                setMember(null);
                return;
            }

            // Convert from snake_case to camelCase
            const memberData: Member = {
                id: data.id,
                name: data.name,
                phone: data.phone,
                email: data.email,
                photoUrl: data.photo_url,
                joinDate: new Date(data.join_date),
                planId: data.plan_id,
                planName: (data.plans as any)?.name || 'Unknown',
                membershipStartDate: new Date(data.membership_start_date),
                membershipExpiryDate: new Date(data.membership_expiry_date),
                notes: data.notes,
                isActive: data.is_active,
                createdAt: new Date(data.created_at),
                updatedAt: new Date(data.updated_at),
            };

            setMember(memberData);
        } catch (error) {
            console.error('Error loading member data:', error);
            setMember(null);
        } finally {
            setLoading(false);
        }
    };

    const calculateDaysRemaining = (expiryDate: Date): number => {
        const today = new Date();
        const diffTime = expiryDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-white">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-black mx-auto mb-4"></div>
                    <p className="text-sm text-gray-500">Loading your membership...</p>
                </div>
            </div>
        );
    }

    if (!member) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-white">
                <div className="text-center">
                    <p className="text-gray-500">No membership found</p>
                </div>
            </div>
        );
    }

    const daysLeft = calculateDaysRemaining(member.membershipExpiryDate);
    const status = getMemberStatus(member.membershipExpiryDate);
    const statusDisplay = getStatusDisplay(status);

    // Status-based colors for time remaining
    const timeRemainingColor =
        status === 'active' ? 'text-green-600' :
            status === 'due-soon' ? 'text-yellow-600' :
                'text-red-600';

    // Status badge colors
    const badgeStyle =
        status === 'active'
            ? 'bg-green-50 text-green-700 border-green-200'
            : status === 'due-soon'
                ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                : 'bg-red-50 text-red-700 border-red-200';

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-black">{PRODUCT_NAME} · {GYM_NAME}</h1>
                    </div>

                    <button
                        onClick={() => signOut()}
                        className="px-6 py-2 border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                    >
                        Logout
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-3xl mx-auto px-6 py-12">
                {/* Membership Card */}
                <div className="border border-gray-200 p-12 rounded-lg">
                    {/* Header with Avatar */}
                    <div className="flex items-center gap-6 mb-8 pb-8 border-b border-gray-200">
                        <MemberAvatar
                            name={member.name}
                            photoUrl={member.photoUrl}
                            size="lg"
                        />
                        <div>
                            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Your Membership</h2>
                            <h3 className="text-3xl font-bold text-black">{member.name}</h3>
                            <p className="text-lg text-gray-600 mt-1">{member.planName}</p>
                        </div>
                    </div>

                    {/* Time Remaining - PROMINENT */}
                    <div className="text-center mb-8 pb-8 border-b border-gray-200">
                        <p className="text-sm text-gray-500 mb-2">Time Remaining</p>
                        {daysLeft >= 0 ? (
                            <p className={`text-5xl font-bold ${timeRemainingColor}`}>
                                {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left
                            </p>
                        ) : (
                            <p className={`text-5xl font-bold ${timeRemainingColor}`}>
                                Expired
                            </p>
                        )}
                    </div>

                    {/* Details */}
                    <div className="space-y-6">
                        {/* Expiry Date */}
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Expires On</p>
                            <p className="text-xl font-semibold text-black">
                                {formatDate(member.membershipExpiryDate)}
                            </p>
                        </div>

                        {/* Status Badge */}
                        <div>
                            <p className="text-sm text-gray-500 mb-2">Status</p>
                            <span className={`inline-block px-4 py-2 border rounded-md font-medium ${badgeStyle}`}>
                                {statusDisplay.label}
                            </span>
                        </div>

                        {/* Renewal Notice for Expired/Due Soon */}
                        {(status === 'expired' || status === 'due-soon') && (
                            <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-md">
                                <p className="text-sm text-gray-700">
                                    {status === 'expired'
                                        ? '⚠️ Your membership has expired. Please contact the gym to renew.'
                                        : '⏰ Your membership is expiring soon. Consider renewing to avoid interruption.'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function MemberDashboardPage() {
    return (
        <MemberGuard>
            <MemberDashboardContent />
        </MemberGuard>
    );
}
