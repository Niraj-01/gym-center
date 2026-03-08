'use client';

/**
 * AnimatedBackground — Ambient floating orbs / gradient mesh
 * Provides a living, breathing backdrop using existing palette colors.
 * Pure CSS animations — zero JS animation loops.
 */

interface AnimatedBackgroundProps {
    variant?: 'mesh' | 'particles';
    className?: string;
}

export function AnimatedBackground({ variant = 'mesh', className = '' }: AnimatedBackgroundProps) {
    if (variant === 'particles') {
        return (
            <div className={`fixed inset-0 overflow-hidden pointer-events-none z-0 ${className}`}>
                {/* Floating orbs using palette colors at very low opacity */}
                <div
                    className="ambient-orb"
                    style={{
                        width: '300px',
                        height: '300px',
                        background: 'rgba(var(--color-primary), 0.08)',
                        top: '10%',
                        left: '15%',
                        animation: 'float-particle 20s ease-in-out infinite',
                    }}
                />
                <div
                    className="ambient-orb"
                    style={{
                        width: '200px',
                        height: '200px',
                        background: 'rgba(var(--color-ring), 0.06)',
                        top: '60%',
                        right: '10%',
                        animation: 'float-particle 25s ease-in-out infinite 5s',
                    }}
                />
                <div
                    className="ambient-orb"
                    style={{
                        width: '250px',
                        height: '250px',
                        background: 'rgba(var(--color-primary), 0.05)',
                        bottom: '15%',
                        left: '50%',
                        animation: 'float-particle 22s ease-in-out infinite 3s',
                    }}
                />
                <div
                    className="ambient-orb"
                    style={{
                        width: '150px',
                        height: '150px',
                        background: 'rgba(var(--color-ring), 0.04)',
                        top: '35%',
                        right: '35%',
                        animation: 'float-particle 18s ease-in-out infinite 8s',
                    }}
                />
            </div>
        );
    }

    // Mesh variant — slow shifting gradient
    return (
        <div className={`fixed inset-0 overflow-hidden pointer-events-none z-0 ${className}`}>
            <div
                className="absolute inset-0 animate-gradient-mesh opacity-30"
                style={{
                    background: `
                        radial-gradient(ellipse at 20% 50%, rgba(var(--color-primary), 0.15) 0%, transparent 50%),
                        radial-gradient(ellipse at 80% 20%, rgba(var(--color-ring), 0.1) 0%, transparent 50%),
                        radial-gradient(ellipse at 40% 80%, rgba(var(--color-primary), 0.08) 0%, transparent 50%)
                    `,
                    backgroundSize: '300% 300%',
                }}
            />
        </div>
    );
}
