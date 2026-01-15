'use client';

/**
 * Members List Page - With Search, Filter & Sort
 */

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Member, MemberStatus, getMemberStatus } from '@/lib/types/member';
import { MemberAvatar } from '@/components/members/MemberAvatar';
import { StatusBadge } from '@/components/members/StatusBadge';
import { ActionButtons } from '@/components/members/ActionButtons';
import { createClient } from '@/lib/supabase/client';
const supabase = createClient();


type SortField = 'name' | 'expiry' | 'joinDate';
type SortOrder = 'asc' | 'desc';

function MembersListContent() {
    const router = useRouter();
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Search & Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | MemberStatus>('all');
    const [sortField, setSortField] = useState<SortField>('name');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Load members
    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("members")
                .select(`
                    id,
                    name,
                    email,
                    phone,
                    photo_url,
                    start_date,
                    expiry_date,
                    plan_id,
                    created_at,
                    plans (
                        id,
                        name,
                        price,
                        duration_days
                    )
                `);

            if (error) {
                console.error('❌ Error fetching members:', error);
                alert(`Database error: ${error.message}`);
            } else {
                console.log('✅ Fetched members:', data?.length);
                // Convert snake_case from DB to camelCase and date strings to Date objects
                const membersWithDates = (data || []).map((member: any) => ({
                    id: member.id,
                    name: member.name,
                    phone: member.phone,
                    email: member.email,
                    photoUrl: member.photo_url,
                    joinDate: member.start_date ? new Date(member.start_date) : new Date(),
                    planId: member.plan_id,
                    planName: member.plans?.name || 'Unknown Plan',
                    membershipStartDate: member.start_date ? new Date(member.start_date) : new Date(),
                    membershipExpiryDate: member.expiry_date ? new Date(member.expiry_date) : new Date(),
                    notes: '',
                    isActive: true,
                    createdAt: member.created_at ? new Date(member.created_at) : new Date(),
                    updatedAt: member.created_at ? new Date(member.created_at) : new Date(),
                }));
                setMembers(membersWithDates);
            }
        } catch (error) {
            console.error('❌ Error fetching members:', error);
            alert('Failed to load members');
        } finally {
            setLoading(false);
        }
    };

    // Filter, Search, and Sort
    const displayedMembers = useMemo(() => {
        let result = [...members];

        // Apply search
        if (debouncedSearch) {
            const query = debouncedSearch.toLowerCase();
            result = result.filter(m =>
                m.name.toLowerCase().includes(query) ||
                m.phone.includes(debouncedSearch)
            );
        }

        // Apply status filter
        if (statusFilter !== 'all') {
            result = result.filter(m =>
                getMemberStatus(m.membershipExpiryDate) === statusFilter
            );
        }

        // Apply sort
        result.sort((a, b) => {
            let comparison = 0;
            if (sortField === 'name') {
                comparison = a.name.localeCompare(b.name);
            } else if (sortField === 'expiry') {
                comparison = a.membershipExpiryDate.getTime() - b.membershipExpiryDate.getTime();
            } else if (sortField === 'joinDate') {
                comparison = a.joinDate.getTime() - b.joinDate.getTime();
            }
            return sortOrder === 'asc' ? comparison : -comparison;
        });

        return result;
    }, [members, debouncedSearch, statusFilter, sortField, sortOrder]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            if (sortOrder === 'asc') {
                setSortOrder('desc');
            } else {
                setSortField('name');
                setSortOrder('asc');
            }
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    const handleClearFilters = () => {
        setSearchQuery('');
        setStatusFilter('all');
        setSortField('name');
        setSortOrder('asc');
    };

    const hasActiveFilters = searchQuery || statusFilter !== 'all' || sortField !== 'name' || sortOrder !== 'asc';

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Delete member "${name}"? This cannot be undone.`)) {
            return;
        }

        try {
            setDeletingId(id);

            const { error } = await supabase
                .from('members')
                .delete()
                .eq('id', id);

            if (error) {
                throw error;
            }

            await fetchMembers();
        } catch (error) {
            console.error('Error deleting member:', error);
            alert('Failed to delete member');
        } finally {
            setDeletingId(null);
        }
    };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        }).format(date);
    };

    const getSortIndicator = (field: SortField) => {
        if (sortField !== field) return null;
        return sortOrder === 'asc' ? ' ↑' : ' ↓';
    };

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto px-6 py-8">
                <PageHeader
                    title="Members"
                    description={`${members.length} total members`}
                    actionLabel="Add Member"
                    onAction={() => router.push('/members/add')}
                />

                {!loading && members.length > 0 && (
                    <>
                        {/* Search & Filter Bar */}
                        <div className="mb-6">
                            <div className="flex flex-col sm:flex-row gap-3 mb-4">
                                {/* Search */}
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        placeholder="Search by name or phone..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-black focus:outline-none focus:border-black transition-colors"
                                    />
                                </div>

                                {/* Status Filter */}
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value as 'all' | MemberStatus)}
                                    className="w-full sm:w-auto px-4 py-3 border border-gray-300 rounded-lg text-black focus:outline-none focus:border-black transition-colors"
                                >
                                    <option value="all">All Members</option>
                                    <option value="active">Active Only</option>
                                    <option value="due-soon">Expiring Soon</option>
                                    <option value="expired">Expired Only</option>
                                </select>
                            </div>

                            {/* Results Summary */}
                            <div className="flex items-center justify-between text-sm text-gray-600">
                                <div>
                                    Showing <span className="font-medium text-black">{displayedMembers.length}</span> of{' '}
                                    <span className="font-medium text-black">{members.length}</span> members
                                    {statusFilter !== 'all' && (
                                        <span className="ml-2">
                                            • Filtered by:{' '}
                                            <span className="font-medium text-black">
                                                {statusFilter === 'active' && 'Active'}
                                                {statusFilter === 'due-soon' && 'Expiring Soon'}
                                                {statusFilter === 'expired' && 'Expired'}
                                            </span>
                                        </span>
                                    )}
                                    {sortField !== 'name' && (
                                        <span className="ml-2">
                                            • Sorted by:{' '}
                                            <span className="font-medium text-black">
                                                {sortField === 'expiry' && 'Expiry Date'}
                                                {sortField === 'joinDate' && 'Join Date'}
                                            </span>
                                            {getSortIndicator(sortField)}
                                        </span>
                                    )}
                                </div>
                                {hasActiveFilters && (
                                    <button
                                        onClick={handleClearFilters}
                                        className="text-gray-600 hover:text-black transition-colors underline"
                                    >
                                        Clear all filters
                                    </button>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-black mx-auto mb-4"></div>
                        <p className="text-sm text-gray-500">Loading members...</p>
                    </div>
                )}

                {/* Empty State */}
                {!loading && members.length === 0 && (
                    <div className="text-center py-16 border border-gray-200 rounded-xl">
                        <p className="text-gray-500 mb-4">No members yet</p>
                        <button
                            onClick={() => router.push('/members/add')}
                            className="px-6 py-3 bg-black text-white hover:bg-gray-800 rounded-lg transition-colors font-medium"
                        >
                            Add First Member
                        </button>
                    </div>
                )}

                {/* No Results State */}
                {!loading && members.length > 0 && displayedMembers.length === 0 && (
                    <div className="text-center py-16 border border-gray-200 rounded-xl">
                        <p className="text-gray-500 mb-4">No members match your filters</p>
                        <button
                            onClick={handleClearFilters}
                            className="px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors font-medium"
                        >
                            Clear Filters
                        </button>
                    </div>
                )}

                {/* Members List */}
                {!loading && displayedMembers.length > 0 && (
                    <>
                        {/* Mobile Card View */}
                        <div className="block lg:hidden space-y-4">
                            {displayedMembers.map((member) => {
                                const status = getMemberStatus(member.membershipExpiryDate);

                                return (
                                    <div
                                        key={member.id}
                                        className="bg-white border border-gray-200 rounded-xl p-4"
                                    >
                                        {/* Member Header */}
                                        <div className="flex items-start gap-3 mb-3">
                                            <div className="flex-shrink-0">
                                                <MemberAvatar
                                                    name={member.name}
                                                    photoUrl={member.photoUrl}
                                                    size="md"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <button
                                                    onClick={() => router.push(`/members/${member.id}`)}
                                                    className="font-semibold text-base text-black hover:underline truncate block"
                                                >
                                                    {member.name}
                                                </button>
                                                <p className="text-sm text-gray-600">
                                                    {member.phone}
                                                </p>
                                            </div>
                                            <StatusBadge status={status} />
                                        </div>

                                        {/* Member Details */}
                                        <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                                            <div>
                                                <p className="text-gray-500">Plan</p>
                                                <p className="font-medium text-gray-900">{member.planName}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Expiry</p>
                                                <p className="font-medium text-gray-900">
                                                    {formatDate(member.membershipExpiryDate)}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Actions - Always visible on mobile */}
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => router.push(`/members/${member.id}/edit`)}
                                                className="flex-1 px-4 py-2.5 bg-black text-white rounded-lg text-sm font-medium"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(member.id, member.name)}
                                                disabled={deletingId === member.id}
                                                className="flex-1 px-4 py-2.5 bg-red-100 text-red-700 rounded-lg text-sm font-medium disabled:opacity-50"
                                            >
                                                {deletingId === member.id ? 'Deleting...' : 'Delete'}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden lg:block border border-gray-200 rounded-xl overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th
                                            onClick={() => handleSort('name')}
                                            className="px-6 py-4 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                                        >
                                            Name{getSortIndicator('name')}
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Phone</th>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Plan</th>
                                        <th
                                            onClick={() => handleSort('expiry')}
                                            className="px-6 py-4 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                                        >
                                            Expiry{getSortIndicator('expiry')}
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Status</th>
                                        <th className="px-6 py-4 text-right text-sm font-medium text-gray-700">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {displayedMembers.map((member) => {
                                        const status = getMemberStatus(member.membershipExpiryDate);

                                        return (
                                            <tr
                                                key={member.id}
                                                className="hover:bg-gray-50 transition-colors group"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <MemberAvatar
                                                            name={member.name}
                                                            photoUrl={member.photoUrl}
                                                            size="sm"
                                                        />
                                                        <button
                                                            onClick={() => router.push(`/members/${member.id}`)}
                                                            className="text-sm font-medium text-black hover:underline"
                                                        >
                                                            {member.name}
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {member.phone}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {member.planName}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {formatDate(member.membershipExpiryDate)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <StatusBadge status={status} size="sm" />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <ActionButtons
                                                        onEdit={() => router.push(`/members/${member.id}/edit`)}
                                                        onDelete={() => handleDelete(member.id, member.name)}
                                                        isDeleting={deletingId === member.id}
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </AdminLayout>
    );
}

export default function MembersListPage() {
    return (
        <AuthGuard>
            <MembersListContent />
        </AuthGuard>
    );
}
