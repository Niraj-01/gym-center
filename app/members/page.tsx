'use client';

/**
 * Members List Page - With Server-Side Pagination, Filtering & Sorting
 * 
 * All filtering, sorting, and pagination is done on the server via Supabase.
 * Uses URL search params to maintain state.
 * 
 * Phase 4 Updates:
 * - Replaced alert() with toast notifications for non-blocking feedback
 * - Added optimistic UI for delete operations (immediate UI update, rollback on failure)
 * - Replaced console.log/error with logger utility for production safety
 */

import { useState, useEffect, useCallback, useOptimistic, startTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { MemberAvatar } from '@/components/members/MemberAvatar';
import { StatusBadge } from '@/components/members/StatusBadge';
import { ActionButtons } from '@/components/members/ActionButtons';
import { DeleteConfirmationModal } from '@/components/members/DeleteConfirmationModal';
import { useToast } from '@/lib/hooks/useToast';
import { logger } from '@/lib/utils/logger';
import {
    getPaginatedMembers,
    deleteMember,
    PaginatedMember,
    MemberStatus,
    SortField,
    SortOrder
} from '@/app/actions/members';

// Pagination component
function Pagination({
    currentPage,
    totalPages,
    onPageChange,
}: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}) {
    if (totalPages <= 1) return null;

    // Generate page numbers to show
    const getPageNumbers = () => {
        const pages: (number | 'ellipsis')[] = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);

            if (currentPage > 3) pages.push('ellipsis');

            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);

            for (let i = start; i <= end; i++) {
                if (!pages.includes(i)) pages.push(i);
            }

            if (currentPage < totalPages - 2) pages.push('ellipsis');

            if (!pages.includes(totalPages)) pages.push(totalPages);
        }

        return pages;
    };

    return (
        <div className="flex items-center justify-center gap-2 mt-6">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
                ← Previous
            </button>

            <div className="flex items-center gap-1">
                {getPageNumbers().map((page, idx) => (
                    page === 'ellipsis' ? (
                        <span key={`ellipsis-${idx}`} className="px-2 py-1 text-gray-400">...</span>
                    ) : (
                        <button
                            key={page}
                            onClick={() => onPageChange(page)}
                            className={`min-w-[40px] px-3 py-2 text-sm rounded-lg transition-colors ${currentPage === page
                                ? 'bg-black text-white'
                                : 'border border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            {page}
                        </button>
                    )
                ))}
            </div>

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
                Next →
            </button>
        </div>
    );
}

function MembersListContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const toast = useToast();

    // Parse URL params for initial state
    const initialPage = parseInt(searchParams.get('page') || '1', 10);
    const initialSearch = searchParams.get('search') || '';
    const initialStatus = (searchParams.get('status') as MemberStatus) || 'all';
    const initialSort = (searchParams.get('sort') as SortField) || 'name';
    const initialOrder = (searchParams.get('order') as SortOrder) || 'asc';

    // State
    const [members, setMembers] = useState<PaginatedMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false); // General deleting state for modal
    const [deletingId, setDeletingId] = useState<string | null>(null); // Specific ID for table row logic if needed

    // Delete Modal State
    const [deleteModal, setDeleteModal] = useState<{
        isOpen: boolean;
        member: { id: string; name: string; phone?: string; email?: string | null } | null;
    }>({
        isOpen: false,
        member: null
    });

    // Optimistic UI for delete - shows immediate update before server responds
    // If server fails, the UI will revert to the original state
    const [optimisticMembers, updateOptimisticMembers] = useOptimistic(
        members,
        (state, deletedId: string) => state.filter(m => m.id !== deletedId)
    );

    // Pagination state
    const [currentPage, setCurrentPage] = useState(initialPage);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const pageSize = 20;

    // Filter/Sort state
    const [searchQuery, setSearchQuery] = useState(initialSearch);
    const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
    const [statusFilter, setStatusFilter] = useState<MemberStatus>(initialStatus);
    const [sortField, setSortField] = useState<SortField>(initialSort);
    const [sortOrder, setSortOrder] = useState<SortOrder>(initialOrder);

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setCurrentPage(1); // Reset to page 1 on new search
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Update URL when filters change
    const updateURL = useCallback((params: Record<string, string | number>) => {
        const url = new URL(window.location.href);
        Object.entries(params).forEach(([key, value]) => {
            if (value && value !== 'all' && value !== 'name' && value !== 'asc' && value !== 1) {
                url.searchParams.set(key, String(value));
            } else {
                url.searchParams.delete(key);
            }
        });
        router.replace(url.pathname + url.search, { scroll: false });
    }, [router]);

    // URL update effect
    useEffect(() => {
        const params: Record<string, string | number> = {
            page: currentPage,
            search: debouncedSearch,
            status: statusFilter,
            sort: sortField,
            order: sortOrder,
        };
        updateURL(params);
    }, [currentPage, debouncedSearch, statusFilter, sortField, sortOrder, updateURL]);

    // Data fetching effect
    useEffect(() => {
        let isMounted = true;

        async function loadMembers() {
            setLoading(true);
            try {
                const result = await getPaginatedMembers({
                    page: currentPage,
                    pageSize,
                    search: debouncedSearch,
                    status: statusFilter,
                    sort: sortField,
                    order: sortOrder,
                });

                if (isMounted) {
                    if (result.error) {
                        logger.error('Error fetching members:', result.error);
                        toast.error(`Failed to load members: ${result.error}`);
                    } else {
                        setMembers(result.data || []);
                        setTotalPages(result.totalPages);
                        setTotalCount(result.totalCount);
                    }
                }
            } catch (error) {
                if (isMounted) {
                    logger.error('Error fetching members:', error);
                    toast.error('Failed to load members');
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }

        loadMembers();

        return () => {
            isMounted = false;
        };
    }, [currentPage, debouncedSearch, statusFilter, sortField, sortOrder]); // Removed toast from deps as it's unstable


    // Handle page change
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Handle sort
    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
        setCurrentPage(1);
    };

    // Handle status filter change
    const handleStatusChange = (status: MemberStatus) => {
        setStatusFilter(status);
        setCurrentPage(1);
    };

    // Clear filters
    const handleClearFilters = () => {
        setSearchQuery('');
        setDebouncedSearch('');
        setStatusFilter('all');
        setSortField('name');
        setSortOrder('asc');
        setCurrentPage(1);
    };

    const hasActiveFilters = debouncedSearch || statusFilter !== 'all' || sortField !== 'name' || sortOrder !== 'asc';

    // Open Delete Modal
    const openDeleteModal = (member: { id: string; name: string; phone: string; email: string | null }) => {
        setDeleteModal({
            isOpen: true,
            member
        });
    };

    // Close Delete Modal
    const closeDeleteModal = () => {
        if (isDeleting) return; // Prevent closing while deleting
        setDeleteModal({
            isOpen: false,
            member: null
        });
    };

    // Confirm Delete
    const confirmDelete = async () => {
        const member = deleteModal.member;
        if (!member) return;

        setIsDeleting(true);
        // Also set deletingId for row-level feedback if any
        setDeletingId(member.id);

        startTransition(async () => {
            try {
                // Optimistic update: remove from UI immediately
                updateOptimisticMembers(member.id);

                // Close modal immediately for better UX with optimistic update? 
                // Or keep it open with loading spinner?
                // The prompt asks for loading state in modal. 
                // But if we do optimistic update, the row disappears from the list in background.
                // Let's keep modal open with loading spinner, then close it on success.

                const result = await deleteMember(parseInt(member.id, 10));

                if (result.error) {
                    throw new Error(result.error);
                }

                toast.success(`${member.name} has been deleted`);
                closeDeleteModal();
            } catch (error) {
                logger.error('Error deleting member:', error);
                toast.error('Failed to delete member');
                // Revert optimistic update by refreshing the page
                window.location.reload();
            } finally {
                setIsDeleting(false);
                setDeletingId(null);
                // Ensure modal is closed if it wasn't already (e.g. on error)
                if (deleteModal.isOpen) {
                    closeDeleteModal();
                }
            }
        });
    };

    // Format date helper
    const formatDate = (dateStr: string) => {
        return new Intl.DateTimeFormat('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        }).format(new Date(dateStr));
    };

    // Sort indicator
    const getSortIndicator = (field: SortField) => {
        if (sortField !== field) return null;
        return sortOrder === 'asc' ? ' ↑' : ' ↓';
    };

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
                <PageHeader
                    title="Members"
                    description={`${totalCount} total members`}
                    actionLabel="Add Member"
                    onAction={() => router.push('/members/add')}
                />

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
                            onChange={(e) => handleStatusChange(e.target.value as MemberStatus)}
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
                            {loading ? (
                                <span>Loading...</span>
                            ) : (
                                <>
                                    Showing <span className="font-medium text-black">{members.length}</span> of{' '}
                                    <span className="font-medium text-black">{totalCount}</span> members
                                    {totalPages > 1 && (
                                        <span className="ml-2">
                                            • Page <span className="font-medium text-black">{currentPage}</span> of{' '}
                                            <span className="font-medium text-black">{totalPages}</span>
                                        </span>
                                    )}
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
                                </>
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

                {/* Loading State */}
                {loading && (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-black mx-auto mb-4"></div>
                        <p className="text-sm text-gray-500">Loading members...</p>
                    </div>
                )}

                {/* Empty State */}
                {!loading && totalCount === 0 && !hasActiveFilters && (
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
                {!loading && optimisticMembers.length === 0 && hasActiveFilters && (
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
                {!loading && optimisticMembers.length > 0 && (
                    <>
                        {/* Mobile Card View */}
                        <div className="block lg:hidden space-y-4">
                            {optimisticMembers.map((member) => (
                                <div
                                    key={member.id}
                                    className="bg-white border border-gray-200 rounded-xl p-4"
                                >
                                    {/* Member Header */}
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className="flex-shrink-0">
                                            <MemberAvatar
                                                name={member.name}
                                                photoUrl={member.photo_url ?? undefined}
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
                                        <StatusBadge status={member.status} />
                                    </div>

                                    {/* Member Details */}
                                    <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                                        <div>
                                            <p className="text-gray-500">Plan</p>
                                            <p className="font-medium text-gray-900">{member.plan_name}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Expiry</p>
                                            <p className="font-medium text-gray-900">
                                                {formatDate(member.expiry_date)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => router.push(`/members/${member.id}/edit`)}
                                            className="flex-1 px-4 py-2.5 bg-black text-white rounded-lg text-sm font-medium"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => openDeleteModal(member)}
                                            disabled={isDeleting && deletingId === member.id}
                                            className="flex-1 px-4 py-2.5 bg-red-100 text-red-700 rounded-lg text-sm font-medium disabled:opacity-50"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
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
                                            onClick={() => handleSort('expiry_date')}
                                            className="px-6 py-4 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                                        >
                                            Expiry{getSortIndicator('expiry_date')}
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Status</th>
                                        <th className="px-6 py-4 text-right text-sm font-medium text-gray-700">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {optimisticMembers.map((member) => (
                                        <tr
                                            key={member.id}
                                            className="hover:bg-gray-50 transition-colors group"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <MemberAvatar
                                                        name={member.name}
                                                        photoUrl={member.photo_url ?? undefined}
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
                                                {member.plan_name}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {formatDate(member.expiry_date)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <StatusBadge status={member.status} size="sm" />
                                            </td>
                                            <td className="px-6 py-4">
                                                <ActionButtons
                                                    onEdit={() => router.push(`/members/${member.id}/edit`)}
                                                    onDelete={() => openDeleteModal(member)}
                                                    isDeleting={isDeleting && deletingId === member.id}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Controls */}
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                        />
                    </>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
                isOpen={deleteModal.isOpen}
                member={deleteModal.member}
                isDeleting={isDeleting}
                onConfirm={confirmDelete}
                onCancel={closeDeleteModal}
            />
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
