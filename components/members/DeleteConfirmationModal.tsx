import { useState } from 'react';

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    member: { id: string; name: string; phone?: string; email?: string | null } | null;
    isDeleting: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export function DeleteConfirmationModal({
    isOpen,
    member,
    isDeleting,
    onConfirm,
    onCancel,
}: DeleteConfirmationModalProps) {
    const [isVisible, setIsVisible] = useState(isOpen);

    // Use a ref-based approach to handle exit animation without setState in effect
    if (isOpen && !isVisible) {
        setIsVisible(true);
    }

    const handleTransitionEnd = () => {
        if (!isOpen) {
            setIsVisible(false);
        }
    };

    if (!isVisible && !isOpen) return null;

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'
                }`}
            onTransitionEnd={handleTransitionEnd}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onCancel}
            />

            {/* Modal Content */}
            <div
                className={`relative w-full max-w-md bg-white rounded-xl shadow-2xl transform transition-all duration-200 ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
                    }`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900">Delete Member</h3>
                    <button
                        onClick={onCancel}
                        disabled={isDeleting}
                        className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-6 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 mb-6 bg-red-100 rounded-full">
                        <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>

                    <h4 className="text-xl font-semibold text-gray-900 mb-2">
                        Are you sure?
                    </h4>
                    <p className="text-gray-500 mb-6">
                        This action cannot be undone. This will permanently delete the member
                        <span className="font-semibold text-gray-900"> {member?.name} </span>
                        and all associated records.
                    </p>

                    {member && (
                        <div className="bg-gray-50 rounded-lg p-4 text-left mb-6 border border-gray-100">
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                <div>
                                    <span className="text-gray-500">Name:</span>
                                    <p className="font-medium text-gray-900">{member.name}</p>
                                </div>
                                {member.phone && (
                                    <div>
                                        <span className="text-gray-500">Phone:</span>
                                        <p className="font-medium text-gray-900">{member.phone}</p>
                                    </div>
                                )}
                                {member.email && (
                                    <div className="col-span-2">
                                        <span className="text-gray-500">Email:</span>
                                        <p className="font-medium text-gray-900">{member.email}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex flex-col-reverse sm:flex-row gap-3 px-6 py-4 bg-gray-50 rounded-b-xl border-t border-gray-100">
                    <button
                        onClick={onCancel}
                        disabled={isDeleting}
                        className="w-full sm:w-auto px-4 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="w-full sm:w-1/2 px-4 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                    >
                        {isDeleting ? (
                            <>
                                <svg className="w-4 h-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Deleting...
                            </>
                        ) : (
                            'Delete Member'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
