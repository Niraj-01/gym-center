'use client';

/**
 * Workout Access Control — Admin can toggle member access to workout plans
 */

import { useState, useEffect } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { WorkoutPlan, MemberWorkoutAccess } from '@/lib/types/workout';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

interface MemberRow {
    id: string;
    name: string;
    phone: string;
    access?: MemberWorkoutAccess;
}

function WorkoutAccessContent() {
    const { user } = useAuth();
    const [members, setMembers] = useState<MemberRow[]>([]);
    const [plans, setPlans] = useState<WorkoutPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [togglingId, setTogglingId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);

            // Load all members
            const { data: membersData } = await supabase
                .from('members')
                .select('id, name, phone')
                .order('name');

            // Load all workout plans
            const { data: plansData } = await supabase
                .from('workout_plans')
                .select('*')
                .eq('is_active', true)
                .order('name');

            // Load existing access records
            const { data: accessData } = await supabase
                .from('member_workout_access')
                .select('*');

            const accessMap = new Map<string, MemberWorkoutAccess>();
            (accessData || []).forEach((a: Record<string, unknown>) => {
                accessMap.set(String(a.member_id), {
                    id: String(a.id),
                    member_id: String(a.member_id),
                    plan_id: String(a.plan_id),
                    has_access: a.has_access as boolean,
                    assigned_at: a.assigned_at as string,
                    assigned_by: a.assigned_by as string,
                });
            });

            const mappedMembers: MemberRow[] = (membersData || []).map((m: Record<string, unknown>) => ({
                id: String(m.id),
                name: m.name as string,
                phone: m.phone as string,
                access: accessMap.get(String(m.id)),
            }));

            const mappedPlans: WorkoutPlan[] = (plansData || []).map((p: Record<string, unknown>) => ({
                id: String(p.id),
                name: p.name as string,
                description: (p.description as string) || '',
                created_by: p.created_by as string,
                is_active: p.is_active as boolean,
                created_at: p.created_at as string,
                updated_at: p.updated_at as string,
            }));

            setMembers(mappedMembers);
            setPlans(mappedPlans);
        } catch (err) {
            console.error('Error loading data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleAccess = async (member: MemberRow) => {
        if (!user?.email) return;
        setTogglingId(member.id);

        try {
            if (member.access) {
                // Toggle existing access
                const { error } = await supabase
                    .from('member_workout_access')
                    .update({ has_access: !member.access.has_access })
                    .eq('id', member.access.id);

                if (error) throw error;
            } else {
                // No access record yet — need to assign a plan first
                if (plans.length === 0) {
                    alert('Please create a workout plan first');
                    return;
                }
                // Default: assign first plan with access enabled
                const { error } = await supabase
                    .from('member_workout_access')
                    .insert({
                        member_id: member.id,
                        plan_id: plans[0].id,
                        has_access: true,
                        assigned_by: user.email,
                    });

                if (error) throw error;
            }

            await loadData();
        } catch (err) {
            console.error('Error toggling access:', err);
        } finally {
            setTogglingId(null);
        }
    };

    const handleAssignPlan = async (memberId: string, planId: string) => {
        if (!user?.email) return;

        try {
            const member = members.find(m => m.id === memberId);

            if (member?.access) {
                const { error } = await supabase
                    .from('member_workout_access')
                    .update({ plan_id: planId })
                    .eq('id', member.access.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('member_workout_access')
                    .insert({
                        member_id: memberId,
                        plan_id: planId,
                        has_access: true,
                        assigned_by: user.email,
                    });
                if (error) throw error;
            }

            await loadData();
        } catch (err) {
            console.error('Error assigning plan:', err);
        }
    };

    const filteredMembers = members.filter(m =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.phone.includes(searchQuery)
    );

    const membersWithAccess = members.filter(m => m.access?.has_access).length;
    const membersWithoutPlan = members.filter(m => !m.access).length;

    return (
        <AdminLayout>
            <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-black">Workout Access Control</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Manage which members can view their workout plans
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="border border-gray-200 rounded-xl p-4">
                        <p className="text-2xl font-bold text-black">{members.length}</p>
                        <p className="text-xs text-gray-500 mt-1">Total Members</p>
                    </div>
                    <div className="border border-gray-200 rounded-xl p-4">
                        <p className="text-2xl font-bold text-green-600">{membersWithAccess}</p>
                        <p className="text-xs text-gray-500 mt-1">With Access</p>
                    </div>
                    <div className="border border-gray-200 rounded-xl p-4">
                        <p className="text-2xl font-bold text-amber-600">{membersWithoutPlan}</p>
                        <p className="text-xs text-gray-500 mt-1">No Plan Assigned</p>
                    </div>
                </div>

                {/* Search */}
                <div className="mb-6">
                    <input
                        type="text"
                        placeholder="Search members..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full max-w-md px-4 py-2.5 border border-gray-300 rounded-lg text-black focus:outline-none focus:border-black transition-colors text-sm"
                    />
                </div>

                {loading ? (
                    <div className="text-center py-16">
                        <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-black mx-auto mb-4"></div>
                        <p className="text-sm text-gray-500">Loading...</p>
                    </div>
                ) : (
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-5 py-3 text-left text-sm font-medium text-gray-700">Member</th>
                                    <th className="px-5 py-3 text-left text-sm font-medium text-gray-700">Assigned Plan</th>
                                    <th className="px-5 py-3 text-center text-sm font-medium text-gray-700">Access</th>
                                    <th className="px-5 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredMembers.map((member) => (
                                    <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-5 py-3">
                                            <div>
                                                <p className="text-sm font-medium text-black">{member.name}</p>
                                                <p className="text-xs text-gray-500">{member.phone}</p>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3">
                                            <select
                                                value={member.access?.plan_id || ''}
                                                onChange={(e) => handleAssignPlan(member.id, e.target.value)}
                                                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-black focus:outline-none focus:border-black"
                                            >
                                                <option value="">No plan assigned</option>
                                                {plans.map(plan => (
                                                    <option key={plan.id} value={plan.id}>{plan.name}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-5 py-3 text-center">
                                            <button
                                                onClick={() => handleToggleAccess(member)}
                                                disabled={togglingId === member.id}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${member.access?.has_access
                                                        ? 'bg-green-500'
                                                        : 'bg-gray-300'
                                                    }`}
                                            >
                                                <span
                                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${member.access?.has_access
                                                            ? 'translate-x-6'
                                                            : 'translate-x-1'
                                                        }`}
                                                />
                                            </button>
                                        </td>
                                        <td className="px-5 py-3">
                                            {!member.access ? (
                                                <span className="flex items-center gap-1.5 text-xs text-amber-600">
                                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                    </svg>
                                                    No plan
                                                </span>
                                            ) : member.access.has_access ? (
                                                <span className="text-xs text-green-600 font-medium">✓ Active</span>
                                            ) : (
                                                <span className="text-xs text-gray-500">Disabled</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {filteredMembers.length === 0 && (
                            <div className="text-center py-12">
                                <p className="text-sm text-gray-500">No members found</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}

export default function WorkoutAccessPage() {
    return (
        <AuthGuard>
            <WorkoutAccessContent />
        </AuthGuard>
    );
}
