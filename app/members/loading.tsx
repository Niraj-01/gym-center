/**
 * Members List Loading State
 * 
 * Shows skeleton UI while members data is being fetched.
 * Matches the layout structure of the members list page.
 */

export default function MembersLoading() {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header Skeleton */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
                    <div className="h-10 w-36 bg-gray-200 rounded animate-pulse" />
                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* Search & Filters Skeleton */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 h-12 bg-white border border-gray-200 rounded-lg animate-pulse" />
                    <div className="h-12 w-40 bg-white border border-gray-200 rounded-lg animate-pulse" />
                    <div className="h-12 w-40 bg-white border border-gray-200 rounded-lg animate-pulse" />
                </div>

                {/* Table Skeleton */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    {/* Table Header */}
                    <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                        <div className="grid grid-cols-6 gap-4">
                            {['w-32', 'w-24', 'w-20', 'w-28', 'w-20', 'w-16'].map((width, i) => (
                                <div key={i} className={`h-4 ${width} bg-gray-200 rounded animate-pulse`} />
                            ))}
                        </div>
                    </div>

                    {/* Table Rows */}
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div key={i} className="px-6 py-4 border-b border-gray-100 last:border-0">
                            <div className="grid grid-cols-6 gap-4 items-center">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse" />
                                    <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
                                </div>
                                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                                <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse" />
                                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                                <div className="flex gap-2">
                                    <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                                    <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Pagination Skeleton */}
                <div className="flex items-center justify-between">
                    <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
                    <div className="flex gap-2">
                        <div className="h-10 w-10 bg-gray-200 rounded animate-pulse" />
                        <div className="h-10 w-10 bg-gray-200 rounded animate-pulse" />
                        <div className="h-10 w-10 bg-gray-200 rounded animate-pulse" />
                    </div>
                </div>
            </div>
        </div>
    );
}
