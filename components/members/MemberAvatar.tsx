/**
 * MemberAvatar - Uber-style circular avatar
 * Shows member photo or placeholder
 * TODO: Will support Firebase Storage URLs when implemented
 */

interface MemberAvatarProps {
    name: string;
    photoUrl?: string;
    size?: 'sm' | 'md' | 'lg';
}

export function MemberAvatar({ name, photoUrl, size = 'md' }: MemberAvatarProps) {
    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-10 h-10',
        lg: 'w-20 h-20',
    };

    const textSizeClasses = {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-xl',
    };

    return (
        <div
            className={`${sizeClasses[size]} rounded-full border border-gray-200 bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0`}
        >
            {photoUrl ? (
                <img
                    src={photoUrl}
                    alt={name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        // Fallback to placeholder if image fails to load
                        e.currentTarget.style.display = 'none';
                        if (e.currentTarget.nextElementSibling) {
                            (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                        }
                    }}
                />
            ) : null}
            {/* Placeholder - shown when no photo or image load fails */}
            <div
                className={`${!photoUrl ? 'flex' : 'hidden'} items-center justify-center w-full h-full`}
            >
                <svg
                    className={`${textSizeClasses[size]} text-gray-400`}
                    fill="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
            </div>
        </div>
    );
}
