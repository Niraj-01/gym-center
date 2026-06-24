'use client';

/**
 * Renewals — membership expiry tracking + one-tap reminders.
 *
 * Lists members whose plan has expired or expires soon, and lets the owner
 * fire a pre-filled WhatsApp reminder (wa.me click-to-chat — no paid API or
 * setup required) or copy the message for SMS/email. The reminder template is
 * editable and persisted in localStorage.
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { GYM_NAME, DEFAULT_REMINDER_TEMPLATE } from '@/lib/config';
import { getRenewals, RenewalsData, RenewalMember } from '@/app/actions/renewals';
import { useToast } from '@/lib/hooks/useToast';

const TEMPLATE_KEY = 'gc_reminder_template';
const INK = '#1A1A1A';
const GREEN = '#2D6A4F';

/* ── helpers ─────────────────────────────────────────────── */

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function statusPhrase(m: RenewalMember): string {
    const date = formatDate(m.expiryDate);
    if (m.daysLeft < 0) {
        const n = Math.abs(m.daysLeft);
        return `expired ${n === 0 ? 'today' : `${n} day${n === 1 ? '' : 's'} ago`} (${date})`;
    }
    if (m.daysLeft === 0) return `expires today (${date})`;
    return `expires in ${m.daysLeft} day${m.daysLeft === 1 ? '' : 's'} (${date})`;
}

function buildMessage(template: string, m: RenewalMember): string {
    return template
        .replaceAll('{name}', m.name)
        .replaceAll('{gym}', GYM_NAME)
        .replaceAll('{plan}', m.planName)
        .replaceAll('{expiry}', formatDate(m.expiryDate))
        .replaceAll('{status}', statusPhrase(m));
}

/** Normalize an Indian phone number to wa.me digits (country code 91 default). */
function waDigits(phone: string): string {
    let d = phone.replace(/\D/g, '');
    if (d.length === 10) d = `91${d}`;
    else if (d.length === 12 && d.startsWith('91')) { /* already prefixed */ }
    else if (d.length === 11 && d.startsWith('0')) d = `91${d.slice(1)}`;
    return d;
}

/* ── member row ──────────────────────────────────────────── */

function RenewalRow({ m, template, index }: { m: RenewalMember; template: string; index: number }) {
    const router = useRouter();
    const toast = useToast();
    const message = buildMessage(template, m);
    const digits = waDigits(m.phone);
    const waLink = `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
    const canWhatsApp = digits.length >= 11;

    const accent = m.daysLeft < 0 ? '#C0392B' : m.daysLeft <= 7 ? '#C77A14' : GREEN;

    const copyMessage = async () => {
        try {
            await navigator.clipboard.writeText(message);
            toast.success('Message copied — paste it into SMS or email.');
        } catch {
            toast.error('Could not copy — clipboard is unavailable.');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03, duration: 0.35 }}
            className="flex flex-col gap-3 border-t border-[#E2D9C9]/60 px-5 py-4 first:border-t-0 sm:flex-row sm:items-center sm:justify-between"
        >
            <div className="flex items-center gap-3 min-w-0">
                <span className="h-9 w-1 flex-shrink-0 rounded-full" style={{ background: accent }} />
                <div className="min-w-0">
                    <button
                        onClick={() => router.push(`/members/${m.id}`)}
                        className="truncate text-left text-[15px] font-semibold text-[#1A1A1A] hover:text-[#2D6A4F] transition-colors"
                    >
                        {m.name}
                    </button>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[#1A1A1A]/55">
                        <span>{m.phone || 'No phone'}</span>
                        <span>·</span>
                        <span>{m.planName}</span>
                        <span>·</span>
                        <span style={{ color: accent, fontWeight: 600 }}>{statusPhrase(m)}</span>
                    </div>
                </div>
            </div>

            <div className="flex flex-shrink-0 items-center gap-2 pl-4 sm:pl-0">
                <a
                    href={canWhatsApp ? waLink : undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-disabled={!canWhatsApp}
                    className={`inline-flex items-center gap-2 rounded-[9px] px-3.5 py-2 text-[#F5F2ED] transition-colors ${canWhatsApp ? 'bg-[#1A1A1A] hover:bg-[#2D6A4F]' : 'bg-[#1A1A1A]/30 pointer-events-none'}`}
                    style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}
                    title={canWhatsApp ? 'Open WhatsApp with the reminder pre-filled' : 'No valid phone number'}
                >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.2-1.7-.8-2-.9-.3-.1-.5-.2-.6.2-.2.3-.7.9-.8 1-.2.2-.3.2-.6.1-.3-.2-1.2-.5-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.5-.5c.1-.2.2-.3.3-.5 0-.2 0-.4 0-.5l-.9-2.1c-.2-.5-.4-.5-.6-.5h-.5c-.2 0-.5.1-.7.3-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.1 4.9 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3z" /><path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.8 4.9-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-2.9.8.8-2.8-.2-.3a8.2 8.2 0 1 1 7 3.6z" /></svg>
                    WhatsApp
                </a>
                <button
                    onClick={copyMessage}
                    className="inline-flex items-center gap-2 rounded-[9px] border border-[#1A1A1A]/20 bg-white px-3.5 py-2 text-[#1A1A1A]/75 transition-colors hover:border-[#1A1A1A]/35"
                    style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}
                    title="Copy the reminder message"
                >
                    Copy
                </button>
                <button
                    onClick={() => router.push(`/members/${m.id}/payment`)}
                    className="inline-flex items-center gap-2 rounded-[9px] border border-[#1A1A1A]/20 bg-white px-3.5 py-2 text-[#1A1A1A]/75 transition-colors hover:border-[#1A1A1A]/35"
                    style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}
                    title="Record a renewal payment"
                >
                    Renew
                </button>
            </div>
        </motion.div>
    );
}

/* ── bucket section ──────────────────────────────────────── */

function Bucket({ title, hint, accent, members, template }: {
    title: string; hint: string; accent: string; members: RenewalMember[]; template: string;
}) {
    if (members.length === 0) return null;
    return (
        <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-8"
        >
            <div className="mb-3 flex items-center gap-3">
                <span className="h-2 w-2 rounded-full" style={{ background: accent }} />
                <h2 className="text-[#1A1A1A]" style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700, fontSize: '15px' }}>
                    {title}
                </h2>
                <span className="rounded-full bg-[#F1EEE8] px-2.5 py-0.5 text-xs font-semibold text-[#1A1A1A]/70">
                    {members.length}
                </span>
                <span className="text-xs text-[#1A1A1A]/45">{hint}</span>
            </div>
            <div className="overflow-hidden rounded-xl border border-[#E2D9C9]/80 bg-white">
                {members.map((m, i) => (
                    <RenewalRow key={m.id} m={m} template={template} index={i} />
                ))}
            </div>
        </motion.section>
    );
}

/* ── page ────────────────────────────────────────────────── */

function RenewalsContent() {
    const [data, setData] = useState<RenewalsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [template, setTemplate] = useState(DEFAULT_REMINDER_TEMPLATE);
    const [editingTemplate, setEditingTemplate] = useState(false);
    const toast = useToast();

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        const result = await getRenewals();
        if (result.error) setError(result.error);
        else setData(result.data);
        setLoading(false);
    }, []);

    useEffect(() => {
        const saved = typeof window !== 'undefined' ? localStorage.getItem(TEMPLATE_KEY) : null;
        if (saved) setTemplate(saved);
        load();
    }, [load]);

    const saveTemplate = () => {
        localStorage.setItem(TEMPLATE_KEY, template);
        setEditingTemplate(false);
        toast.success('Template saved — reminders will use your message.');
    };

    const resetTemplate = () => {
        setTemplate(DEFAULT_REMINDER_TEMPLATE);
        localStorage.removeItem(TEMPLATE_KEY);
    };

    const total = data ? data.expired.length + data.dueSoon.length + data.upcoming.length : 0;

    return (
        <AdminLayout>
            <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
                <PageHeader
                    title="Renewals"
                    description="Members who need a nudge to renew — send a reminder in one tap."
                    secondaryActionLabel={editingTemplate ? 'Close template' : 'Edit message'}
                    onSecondaryAction={() => setEditingTemplate((v) => !v)}
                />

                {/* Template editor */}
                {editingTemplate && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mb-8 overflow-hidden rounded-xl border border-[#E2D9C9]/80 bg-white p-5"
                    >
                        <p className="eyebrow mb-2 text-[#1A1A1A]/50">Reminder message</p>
                        <textarea
                            value={template}
                            onChange={(e) => setTemplate(e.target.value)}
                            rows={3}
                            className="w-full resize-none rounded-[10px] border border-[#E2D9C9] bg-white p-3 text-sm text-[#1A1A1A] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                        />
                        <p className="mt-2 text-xs text-[#1A1A1A]/45">
                            Placeholders: <code className="text-[#2D6A4F]">{'{name}'}</code>{' '}
                            <code className="text-[#2D6A4F]">{'{gym}'}</code>{' '}
                            <code className="text-[#2D6A4F]">{'{plan}'}</code>{' '}
                            <code className="text-[#2D6A4F]">{'{expiry}'}</code>{' '}
                            <code className="text-[#2D6A4F]">{'{status}'}</code>
                        </p>
                        <div className="mt-4 flex items-center gap-2">
                            <button
                                onClick={saveTemplate}
                                className="rounded-[10px] bg-[#1A1A1A] px-5 py-2 text-[#F5F2ED] transition-colors hover:bg-[#2D6A4F]"
                                style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}
                            >
                                Save
                            </button>
                            <button
                                onClick={resetTemplate}
                                className="rounded-[10px] border border-[#1A1A1A]/20 bg-white px-5 py-2 text-[#1A1A1A]/70 transition-colors hover:border-[#1A1A1A]/35"
                                style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}
                            >
                                Reset
                            </button>
                        </div>
                    </motion.div>
                )}

                {loading ? (
                    <div className="py-12 text-center">
                        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-[#E2D9C9] border-t-[#2D6A4F]" />
                        <p className="text-sm text-[#1A1A1A]/50">Loading renewals...</p>
                    </div>
                ) : error ? (
                    <div className="py-12 text-center">
                        <p className="mb-4 text-[#C0392B]">{error}</p>
                        <button
                            onClick={load}
                            className="rounded-[10px] bg-[#1A1A1A] px-5 py-2.5 text-[#F5F2ED] transition-colors hover:bg-[#2D6A4F]"
                            style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12.5px', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}
                        >
                            Retry
                        </button>
                    </div>
                ) : total === 0 ? (
                    <div className="rounded-xl border border-[#E2D9C9]/80 bg-white py-16 text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2D6A4F]/10 text-[#2D6A4F]">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                        </div>
                        <h2 className="text-[#1A1A1A]" style={{ fontFamily: "'Zilla Slab', serif", fontWeight: 700, fontSize: '22px' }}>All caught up</h2>
                        <p className="mt-1 text-sm text-[#1A1A1A]/55">No memberships are expiring in the next 30 days.</p>
                    </div>
                ) : (
                    <div>
                        <Bucket title="Expired" hint="needs renewal now" accent="#C0392B" members={data!.expired} template={template} />
                        <Bucket title="Expiring soon" hint="within 7 days" accent="#C77A14" members={data!.dueSoon} template={template} />
                        <Bucket title="Upcoming" hint="within 30 days" accent={GREEN} members={data!.upcoming} template={template} />
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}

export default function RenewalsPage() {
    return (
        <AuthGuard>
            <RenewalsContent />
        </AuthGuard>
    );
}
