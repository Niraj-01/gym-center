'use client';

/**
 * UPI Settings Component
 * Allows members to view, add, and update their UPI ID for payments
 * Refactored to use new Design System components
 */

import { useState, useEffect } from 'react';
import { getMemberUPIByPhone, updateMemberUPI } from '@/app/actions/members';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Copy, CreditCard, Edit2, Loader2, Save, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface UPISettingsProps {
    phone: string;
}

export default function UPISettings({ phone }: UPISettingsProps) {
    const [upiId, setUpiId] = useState('');
    const [savedUpiId, setSavedUpiId] = useState('');
    const [memberId, setMemberId] = useState<number | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        loadUPI();
    }, [phone]);

    const loadUPI = async () => {
        try {
            setIsLoading(true);
            const result = await getMemberUPIByPhone(phone);

            if (result.memberId) {
                setMemberId(result.memberId);
            }

            if (result.upiId) {
                setSavedUpiId(result.upiId);
                setUpiId(result.upiId);
            } else {
                // No UPI saved, show input to add one
                setIsEditing(true);
            }
        } catch (err) {
            console.error('Failed to load UPI:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const validateUPI = (value: string) => {
        return /^[\w.-]+@[\w.-]+$/.test(value);
    };

    const handleSave = async () => {
        setError('');

        if (!upiId.trim()) {
            setError('UPI ID is required');
            return;
        }

        if (!validateUPI(upiId)) {
            setError('Invalid UPI ID format (e.g., yourname@paytm)');
            return;
        }

        if (!memberId) {
            setError('Member not found');
            return;
        }

        setIsSaving(true);

        try {
            const result = await updateMemberUPI(memberId, upiId);

            if (!result.success) {
                setError(result.error || 'Failed to save UPI ID');
                return;
            }

            setSavedUpiId(result.upiId || upiId.toLowerCase().trim());
            setIsEditing(false);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (err) {
            setError('Failed to save UPI ID. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(savedUpiId);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    if (isLoading) {
        return (
            <Card className="p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-5 bg-muted rounded w-1/3"></div>
                    <div className="h-12 bg-muted/50 rounded-xl"></div>
                </div>
            </Card>
        );
    }

    return (
        <Card className="p-6 space-y-6" variant="glass">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
                    Payment Settings
                </h3>
                {savedUpiId && !isEditing && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        leftIcon={<Edit2 className="w-4 h-4" />}
                    >
                        Edit
                    </Button>
                )}
            </div>

            <AnimatePresence mode='wait'>
                {showSuccess && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="p-4 bg-green-50/50 border border-green-200/50 rounded-xl flex items-center gap-3 backdrop-blur-sm text-green-700"
                    >
                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                            <Check className="w-3.5 h-3.5 text-green-600" />
                        </div>
                        <span className="font-medium text-sm">UPI ID updated successfully</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {isEditing ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-4"
                >
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground ml-1">
                            UPI ID <span className="text-destructive">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={upiId}
                                onChange={(e) => {
                                    setUpiId(e.target.value);
                                    setError('');
                                }}
                                placeholder="yourname@paytm"
                                className={cn(
                                    "w-full px-4 py-3 bg-surface-elevated border-2 rounded-xl outline-none transition-all duration-300",
                                    "focus:ring-4 focus:ring-primary/10",
                                    error
                                        ? 'border-destructive/50 focus:border-destructive'
                                        : 'border-transparent focus:border-primary'
                                )}
                                disabled={isSaving}
                            />
                        </div>
                        <AnimatePresence>
                            {error && (
                                <motion.p
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="text-xs text-destructive font-medium ml-1"
                                >
                                    {error}
                                </motion.p>
                            )}
                        </AnimatePresence>
                        <p className="text-xs text-muted-foreground ml-1">
                            Examples: yourname@paytm, MobileNumber@ybl
                        </p>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button
                            variant="default"
                            className="flex-1"
                            onClick={handleSave}
                            isLoading={isSaving}
                            disabled={!upiId.trim()}
                            leftIcon={!isSaving && <Save className="w-4 h-4" />}
                        >
                            Save Changes
                        </Button>
                        {savedUpiId && (
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    setUpiId(savedUpiId);
                                    setIsEditing(false);
                                    setError('');
                                }}
                                disabled={isSaving}
                            >
                                Cancel
                            </Button>
                        )}
                    </div>
                </motion.div>
            ) : (
                <motion.div
                    layoutId="view-card"
                    className="p-5 bg-surface-elevated/50 rounded-2xl border border-border/50 flex items-center justify-between group hover:border-primary/20 transition-colors"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-purple-500/10 flex items-center justify-center text-primary">
                            <CreditCard className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                                Linked UPI ID
                            </p>
                            <p className="text-lg font-semibold text-foreground tracking-tight">
                                {savedUpiId}
                            </p>
                        </div>
                    </div>
                    <Button
                        variant={copied ? 'default' : 'outline'}
                        size="sm"
                        onClick={copyToClipboard}
                        className={cn(
                            "transition-all duration-300",
                            copied ? "bg-green-600 hover:bg-green-700 text-white shadow-green-200" : ""
                        )}
                        leftIcon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    >
                        {copied ? 'Copied' : 'Copy'}
                    </Button>
                </motion.div>
            )}
        </Card>
    );
}

