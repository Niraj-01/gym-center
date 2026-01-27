/**
 * Dashboard Loading State
 * 
 * Shows skeleton UI while dashboard data is being fetched.
 * Matches the layout structure of the actual dashboard page.
 */

export default function DashboardLoading() {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header Skeleton */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
                    <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
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
                                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                                <div className="h-10 w-10 bg-gray-100 rounded-lg animate-pulse" />
                            </div>
                            <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
                        </div>
                    ))}
                </div>

                {/* Charts/Tables Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-6" />
                        <div className="h-48 bg-gray-100 rounded animate-pulse" />
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-6" />
                        <div className="space-y-3">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
