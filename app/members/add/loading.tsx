/**
 * Add Member Loading State
 * 
 * Shows skeleton UI while add member page is loading.
 * Matches the layout structure of the add member page.
 */

export default function AddMemberLoading() {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header Skeleton */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-gray-200 rounded animate-pulse" />
                    <div>
                        <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-1" />
                        <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
                    </div>
                </div>
            </div>

            <div className="p-6 max-w-4xl mx-auto space-y-6">
                {/* Method Selection Cards Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2].map((i) => (
                        <div
                            key={i}
                            className="bg-white border border-gray-200 rounded-xl p-6"
                        >
                            <div className="h-14 w-14 bg-gray-100 rounded-xl animate-pulse mb-4" />
                            <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-2" />
                            <div className="h-4 w-full bg-gray-100 rounded animate-pulse mb-4" />
                            <div className="space-y-2 mb-4">
                                {[1, 2, 3].map((j) => (
                                    <div key={j} className="h-4 w-40 bg-gray-100 rounded animate-pulse" />
                                ))}
                            </div>
                            <div className="h-10 w-36 bg-gray-200 rounded-lg animate-pulse" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
