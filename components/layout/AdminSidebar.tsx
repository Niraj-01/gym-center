'use client';

/**
 * AdminSidebar - Sticky sidebar navigation for admin pages
 * Enhanced with springy microinteractions, animated active indicator, and staggered nav reveals.
 */

import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface NavItem {
    label: string;
    path: string;
    icon: React.ReactNode;
}

const navItems: NavItem[] = [
    {
        label: 'Dashboard',
        path: '/dashboard',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
        ),
    },
    {
        label: 'Members',
        path: '/members',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
        ),
    },
    {
        label: 'Add Member',
        path: '/members/add',
        icon: (
            <div className="relative">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                {/* Sparkles indicator for smart/auto functionality */}
                <svg className="absolute -top-1 -right-1 w-3 h-3 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0L14.59 8.41L23 11L14.59 13.59L12 22L9.41 13.59L1 11L9.41 8.41L12 0Z" />
                </svg>
            </div>
        ),
    },
    {
        label: 'Renewals',
        path: '/renewals',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
        ),
    },
    {
        label: 'Plans',
        path: '/plans',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
        ),
    },
    {
        label: 'Workouts',
        path: '/admin/workouts',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
        ),
    },
    {
        label: 'Workout Access',
        path: '/admin/workout-access',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
        ),
    },
    {
        label: 'Settings',
        path: '/settings',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        ),
    },
];

const navItemVariants = {
    hidden: { opacity: 0, x: -12 },
    visible: (i: number) => ({
        opacity: 1,
        x: 0,
        transition: {
            delay: i * 0.06,
            duration: 0.4,
            ease: [0.22, 1, 0.36, 1] as const,
        },
    }),
};

export function AdminSidebar() {
    const pathname = usePathname();
    const router = useRouter();

    const isActive = (path: string) => {
        if (path === '/dashboard') {
            return pathname === '/dashboard';
        }
        return pathname.startsWith(path);
    };

    return (
        <aside className="w-64 bg-[#FBFAF7] border-r border-[#E2D9C9]/70 min-h-screen sticky top-0 hidden lg:block">
            {/* Logo */}
            <div className="px-4 py-5 border-b border-[#E2D9C9]/70">
                <motion.button
                    onClick={() => router.push('/dashboard')}
                    className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-[#F1EEE8] transition-colors duration-200 w-full"
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', outline: 'none' }}
                    whileTap={{ scale: 0.98 }}
                >
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#1A1A1A] text-[13px] font-bold tracking-tight text-[#F5F2ED]">
                        GC
                    </span>
                    <span
                        style={{
                            fontFamily: "'Zilla Slab', serif",
                            fontSize: '20px',
                            fontWeight: 700,
                            color: '#1A1A1A',
                            letterSpacing: '-0.01em',
                        }}
                    >
                        GymCentre
                    </span>
                </motion.button>
            </div>

            {/* Navigation */}
            <nav className="p-3">
                <ul className="space-y-1">
                    <AnimatePresence>
                        {navItems.map((item, index) => (
                            <motion.li
                                key={item.path}
                                custom={index}
                                variants={navItemVariants}
                                initial="hidden"
                                animate="visible"
                            >
                                <motion.button
                                    onClick={() => router.push(item.path)}
                                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-[10px] text-[13.5px] transition-colors relative ${isActive(item.path)
                                        ? 'bg-[#F1EEE8] text-[#1A1A1A] font-semibold'
                                        : 'text-[#1A1A1A]/60 hover:bg-[#F1EEE8]/60 hover:text-[#1A1A1A] font-medium'
                                        }`}
                                    whileHover={{ x: 3, transition: { type: 'spring', stiffness: 400, damping: 20 } }}
                                    whileTap={{ scale: 0.97 }}
                                >
                                    {/* Animated active indicator bar */}
                                    {isActive(item.path) && (
                                        <motion.div
                                            layoutId="sidebar-active-indicator"
                                            className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                                            style={{ background: '#2D6A4F' }}
                                            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                                        />
                                    )}
                                    {item.icon}
                                    {item.label}
                                </motion.button>
                            </motion.li>
                        ))}
                    </AnimatePresence>
                </ul>
            </nav>
        </aside>
    );
}
