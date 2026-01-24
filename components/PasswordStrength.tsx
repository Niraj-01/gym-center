'use client';

interface PasswordStrengthProps {
    password: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
    const getStrength = () => {
        if (!password) return { level: 0, text: '', color: '' };

        let strength = 0;
        if (password.length >= 6) strength++;
        if (password.length >= 8) strength++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[^a-zA-Z0-9]/.test(password)) strength++;

        if (strength <= 1) return { level: 1, text: 'Weak', color: 'bg-red-500' };
        if (strength <= 3) return { level: 2, text: 'Medium', color: 'bg-yellow-500' };
        return { level: 3, text: 'Strong', color: 'bg-green-500' };
    };

    const strength = getStrength();

    if (!password) return null;

    return (
        <div className="mt-2">
            <div className="flex gap-1 mb-1">
                <div className={`h-1 flex-1 rounded ${strength.level >= 1 ? strength.color : 'bg-gray-200'}`} />
                <div className={`h-1 flex-1 rounded ${strength.level >= 2 ? strength.color : 'bg-gray-200'}`} />
                <div className={`h-1 flex-1 rounded ${strength.level >= 3 ? strength.color : 'bg-gray-200'}`} />
            </div>
            <p className="text-xs text-gray-600">
                Password strength: <span className="font-medium">{strength.text}</span>
            </p>
        </div>
    );
}
