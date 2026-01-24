'use client';

/**
 * AdminLayout - Shared layout wrapper for admin pages with sidebar
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AdminSidebar } from './AdminSidebar';

interface AdminLayoutProps {
    children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
    const router = useRouter();
    const { user, signOut } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-white flex">
            {/* Desktop Sidebar */}
            <AdminSidebar />

            {/* Mobile Header & Menu */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
                <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                        <img src="/logo.png" alt="GymCentre" className="h-6" />
                        <span className="font-semibold text-black">GymCentre</span>
                    </div>
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="p-2 text-gray-600 hover:text-black"
                        aria-label="Toggle menu"
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
                    </button>
                </div>

                {/* Mobile Menu Dropdown */}
                {mobileMenuOpen && (
                    <div className="bg-white border-b border-gray-200 py-2">
                        <button
                            onClick={() => { router.push('/dashboard'); setMobileMenuOpen(false); }}
                            className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50"
                        >
                            Dashboard
                        </button>
                        <button
                            onClick={() => { router.push('/members'); setMobileMenuOpen(false); }}
                            className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50"
                        >
                            Members
                        </button>
                        <button
                            onClick={() => { router.push('/members/scan'); setMobileMenuOpen(false); }}
                            className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50"
                        >
                            Scan Document
                        </button>
                        <button
                            onClick={() => { router.push('/plans'); setMobileMenuOpen(false); }}
                            className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50"
                        >
                            Plans
                        </button>
                        <button
                            onClick={() => { router.push('/settings'); setMobileMenuOpen(false); }}
                            className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50"
                        >
                            Settings
                        </button>
                        <div className="border-t border-gray-100 mt-2 pt-2">
                            <button
                                onClick={() => signOut()}
                                className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Main Content */}
            <div className="flex-1 lg:ml-0">
                {/* Desktop Header */}
                <header className="hidden lg:flex items-center justify-end px-8 py-4 border-b border-gray-200 bg-white sticky top-0 z-40">
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-sm font-medium text-black">Admin</p>
                            <p className="text-xs text-gray-500">{user?.email || 'admin@gymcentre.com'}</p>
                        </div>
                        <button
                            onClick={() => signOut()}
                            className="px-4 py-2 border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                            Sign Out
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="pt-16 lg:pt-0">
                    {children}
                </main>
            </div>
        </div>
    );
}
