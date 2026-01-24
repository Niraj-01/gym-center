interface ConfidenceBadgeProps {
    score: number;
}

export function ConfidenceBadge({ score }: ConfidenceBadgeProps) {
    const getColor = () => {
        if (score >= 90) return 'text-green-600';
        if (score >= 70) return 'text-amber-600';
        return 'text-red-600';
    };

    return (
        <span className={`text-xs font-semibold ${getColor()}`}>
            {score}%
        </span>
    );
}
