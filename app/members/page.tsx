'use client';

/**
 * Members List Page - With Search, Filter & Sort
 */

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useAuth } from '@/contexts/AuthContext';
import { Member, MemberStatus, getMemberStatus, getStatusDisplay } from '@/lib/types/member';
import { getAllMembers, deleteMember } from '@/lib/services/mock-firestore';
import { MemberAvatar } from '@/components/members/MemberAvatar';

type SortField = 'name' | 'expiry' | 'joinDate';
type SortOrder = 'asc' | 'desc';

function MembersListContent() {
    const router = useRouter();
    const { signOut } = useAuth();
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
        loadMembers();
    }, []);

    const loadMembers = async () => {
        try {
            setLoading(true);
            const data = await getAllMembers();
            setMembers(data);
        } catch (error) {
            console.error('Error loading members:', error);
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
            // Toggle order or reset
            if (sortOrder === 'asc') {
                setSortOrder('desc');
            } else {
                // Reset to default
                setSortField('name');
                setSortOrder('asc');
            }
        } else {
            // New field, start with ASC
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
            await deleteMember(id);
            await loadMembers();
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
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-black">GymCentre</h1>
                        <p className="text-sm text-gray-500 mt-1">Member Management</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="px-4 py-2 text-sm text-gray-700 hover:text-black transition-colors"
                        >
                            Dashboard
                        </button>
                        <button
                            onClick={() => signOut()}
                            className="px-6 py-2 border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Page Header */}
                <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200">
                    <div>
                        <h2 className="text-2xl font-semibold text-black">Members</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {members.length} total members
                        </p>
                    </div>
                    <button
                        onClick={() => router.push('/members/add')}
                        className="px-6 py-3 bg-black text-white hover:bg-gray-800 transition-colors font-medium"
                    >
                        Add Member
                    </button>
                </div>

                {!loading && members.length > 0 && (
                    <>
                        {/* Search & Filter Bar */}
                        <div className="mb-6">
                            <div className="flex gap-4 mb-4">
                                {/* Search */}
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        placeholder="Search by name or phone..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 text-black focus:outline-none focus:border-black transition-colors"
                                    />
                                </div>

                                {/* Status Filter */}
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value as 'all' | MemberStatus)}
                                    className="px-4 py-3 border border-gray-300 text-black focus:outline-none focus:border-black transition-colors"
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
                    <div className="text-center py-16 border border-gray-200">
                        <p className="text-gray-500 mb-4">No members yet</p>
                        <button
                            onClick={() => router.push('/members/add')}
                            className="px-6 py-3 bg-black text-white hover:bg-gray-800 transition-colors font-medium"
                        >
                            Add First Member
                        </button>
                    </div>
                )}

                {/* No Results State */}
                {!loading && members.length > 0 && displayedMembers.length === 0 && (
                    <div className="text-center py-16 border border-gray-200">
                        <p className="text-gray-500 mb-4">No members match your filters</p>
                        <button
                            onClick={handleClearFilters}
                            className="px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                        >
                            Clear Filters
                        </button>
                    </div>
                )}

                {/* Members Table */}
                {!loading && displayedMembers.length > 0 && (
                    <div className="border border-gray-200">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th
                                        onClick={() => handleSort('name')}
                                        className="px-6 py-4 text-left text-sm font-semibold text-black cursor-pointer hover:bg-gray-100 transition-colors"
                                    >
                                        Name{getSortIndicator('name')}
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-black">Phone</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-black">Plan</th>
                                    <th
                                        onClick={() => handleSort('expiry')}
                                        className="px-6 py-4 text-left text-sm font-semibold text-black cursor-pointer hover:bg-gray-100 transition-colors"
                                    >
                                        Expiry{getSortIndicator('expiry')}
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-black">Status</th>
                                    <th className="px-6 py-4 text-right text-sm font-semibold text-black">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {displayedMembers.map((member) => {
                                    const status = getMemberStatus(member.membershipExpiryDate);
                                    const statusDisplay = getStatusDisplay(status);

                                    return (
                                        <tr
                                            key={member.id}
                                            className="hover:bg-gray-50 transition-colors"
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
                                                <span className={`text-sm font-medium ${statusDisplay.color}`}>
                                                    {statusDisplay.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => router.push(`/members/${member.id}/edit`)}
                                                        className="px-4 py-2 text-sm text-gray-700 hover:text-black transition-colors"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(member.id, member.name)}
                                                        disabled={deletingId === member.id}
                                                        className="px-4 py-2 text-sm text-gray-500 hover:text-black transition-colors disabled:opacity-50"
                                                    >
                                                        {deletingId === member.id ? 'Deleting...' : 'Delete'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>
        </div>
    );
}

export default function MembersListPage() {
    return (
        <AuthGuard>
            <MembersListContent />
        </AuthGuard>
    );
}
