'use client';

/**
 * AdminLayout - Shared layout wrapper for admin pages with sidebar
 * Enhanced with animated mobile menu, glassmorphic header, and content transitions.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AdminSidebar } from './AdminSidebar';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminLayoutProps {
    children: React.ReactNode;
}

const mobileMenuVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: {
        opacity: 1,
        height: 'auto',
        transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
    },
    exit: {
        opacity: 0,
        height: 0,
        transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] }
    }
};

const mobileItemVariants = {
    hidden: { opacity: 0, x: -12 },
    visible: (i: number) => ({
        opacity: 1,
        x: 0,
        transition: { delay: i * 0.05, duration: 0.3 }
    }),
};

export function AdminLayout({ children }: AdminLayoutProps) {
    const router = useRouter();
    const { user, signOut } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const mobileNavItems = [
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Members', path: '/members' },
        { label: 'Add Member', path: '/members/add' },
        { label: 'Plans', path: '/plans' },
        { label: 'Settings', path: '/settings' },
    ];

    return (
        <div className="min-h-screen bg-white flex">
            {/* Desktop Sidebar */}
            <AdminSidebar />

            {/* Mobile Header & Menu */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200">
                <div className="flex items-center justify-between px-4 py-3">
                    <motion.button
                        onClick={() => { router.push('/dashboard'); setMobileMenuOpen(false); }}
                        className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', outline: 'none' }}
                        whileTap={{ scale: 0.97 }}
                    >
                        <img src="/logo.png" alt="GC" className="h-7 w-7 object-contain flex-shrink-0" />
                        <span
                            style={{
                                fontSize: '16px',
                                fontWeight: 600,
                                color: '#000000',
                                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                            }}
                        >
                            GymCentre
                        </span>
                    </motion.button>
                    <motion.button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="p-2 text-gray-600 hover:text-black"
                        aria-label="Toggle menu"
                        whileTap={{ scale: 0.9, rotate: mobileMenuOpen ? -90 : 90 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    >
                        {mobileMenuOpen ? (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        )}
                    </motion.button>
                </div>

                {/* Mobile Menu Dropdown — animated */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div
                            className="bg-white/95 backdrop-blur-lg border-b border-gray-200 py-2 overflow-hidden"
                            variants={mobileMenuVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                        >
                            {mobileNavItems.map((item, index) => (
                                <motion.button
                                    key={item.path}
                                    custom={index}
                                    variants={mobileItemVariants}
                                    initial="hidden"
                                    animate="visible"
                                    onClick={() => { router.push(item.path); setMobileMenuOpen(false); }}
                                    className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 interactive-spring"
                                    whileTap={{ scale: 0.98, x: 8 }}
                                >
                                    {item.label}
                                </motion.button>
                            ))}
                            <div className="border-t border-gray-100 mt-2 pt-2">
                                <motion.button
                                    onClick={() => signOut()}
                                    className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50"
                                    whileTap={{ scale: 0.98 }}
                                >
                                    Sign Out
                                </motion.button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Main Content */}
            <div className="flex-1 lg:ml-0">
                {/* Desktop Header — glassmorphic */}
                <header className="hidden lg:flex items-center justify-end px-8 py-4 border-b border-gray-200/80 bg-white/80 backdrop-blur-xl sticky top-0 z-40">
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-sm font-medium text-black">Admin</p>
                            <p className="text-xs text-gray-500">{user?.email || 'admin@gymcentre.com'}</p>
                        </div>
                        <motion.button
                            onClick={() => signOut()}
                            className="px-4 py-2 border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                            whileHover={{ y: -1 }}
                            whileTap={{ scale: 0.97 }}
                        >
                            Sign Out
                        </motion.button>
                    </div>
                </header>

                {/* Page Content with fade transition */}
                <motion.main
                    className="pt-16 lg:pt-0"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                    {children}
                </motion.main>
            </div>
        </div>
    );
}
