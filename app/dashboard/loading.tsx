/**
 * Dashboard Loading State
 * Enhanced with flowing skeleton shimmer instead of basic pulse.
 */

export default function DashboardLoading() {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header Skeleton */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="h-8 w-48 rounded animate-skeleton-shimmer" />
                    <div className="h-10 w-32 rounded animate-skeleton-shimmer" style={{ animationDelay: '0.1s' }} />
                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* Stats Cards Skeleton */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div
                            key={i}
                            className="bg-white rounded-xl border border-gray-200 p-6"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="h-4 w-24 rounded animate-skeleton-shimmer" style={{ animationDelay: `${i * 0.1}s` }} />
                                <div className="h-10 w-10 rounded-lg animate-skeleton-shimmer" style={{ animationDelay: `${i * 0.1 + 0.05}s` }} />
                            </div>
                            <div className="h-8 w-16 rounded animate-skeleton-shimmer" style={{ animationDelay: `${i * 0.1 + 0.1}s` }} />
                        </div>
                    ))}
                </div>

                {/* Charts/Tables Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <div className="h-5 w-40 rounded animate-skeleton-shimmer mb-6" style={{ animationDelay: '0.5s' }} />
                        <div className="h-48 rounded animate-skeleton-shimmer" style={{ animationDelay: '0.6s' }} />
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <div className="h-5 w-40 rounded animate-skeleton-shimmer mb-6" style={{ animationDelay: '0.5s' }} />
                        <div className="space-y-3">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="h-12 rounded animate-skeleton-shimmer" style={{ animationDelay: `${0.5 + i * 0.1}s` }} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
