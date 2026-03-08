'use client';

/**
 * useCountUp — Animate a number from 0 to target with easing.
 * Used for stats/counters to give a "live data" feel.
 */

import { useState, useEffect, useRef } from 'react';

function easeOutExpo(t: number): number {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

export function useCountUp(target: number, duration: number = 1200, delay: number = 0): number {
    const [current, setCurrent] = useState(0);
    const prevTarget = useRef(0);
    const frameRef = useRef<number>(0);

    useEffect(() => {
        const startValue = prevTarget.current;
        prevTarget.current = target;

        if (target === 0) {
            setCurrent(0);
            return;
        }

        let startTime: number | null = null;
        let timeoutId: ReturnType<typeof setTimeout>;

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easeOutExpo(progress);

            const value = Math.round(startValue + (target - startValue) * easedProgress);
            setCurrent(value);

            if (progress < 1) {
                frameRef.current = requestAnimationFrame(animate);
            }
        };

        timeoutId = setTimeout(() => {
            frameRef.current = requestAnimationFrame(animate);
        }, delay);

        return () => {
            clearTimeout(timeoutId);
            cancelAnimationFrame(frameRef.current);
        };
    }, [target, duration, delay]);

    return current;
}
