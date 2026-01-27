/**
 * SuccessScreen Component
 * 
 * Displays success confirmation after a member is added.
 * Provides options to add another member or view all members.
 */

import { useRouter } from 'next/navigation';

interface SuccessScreenProps {
    /** Name of the member that was just added */
    memberName: string;
    /** Callback to reset and add another member */
    onAddAnother: () => void;
}

export function SuccessScreen({ memberName, onAddAnother }: SuccessScreenProps) {
    const router = useRouter();

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
            {/* Success Icon */}
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
            </div>

            {/* Success Message */}
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Member Added Successfully!</h3>
            <p className="text-gray-500 mb-6">{memberName} has been added to your gym.</p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                    onClick={onAddAnother}
                    className="px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-900 transition"
                >
                    Add Another Member
                </button>
                <button
                    onClick={() => router.push('/members')}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
                >
                    View All Members
                </button>
            </div>
        </div>
    );
}
