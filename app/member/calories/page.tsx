'use client';

/**
 * Calorie Tracker — Track daily food intake with AI-powered nutrition lookup
 * Uses Gemini AI via server action to automatically fetch calories & macros.
 * Data persists in localStorage, keyed by date.
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { MemberPhoneGuard } from '@/components/auth/MemberPhoneGuard';
import { lookupNutrition } from '@/app/actions/nutrition';
import { GYM_NAME } from '@/lib/config';

// ─── Types ──────────────────────────────────────────────────────────
interface FoodEntry {
    id: number;
    name: string;
    cal: number;
    prot: number;
    carb: number;
    fat: number;
    fiber: number;
}

// ─── Helpers ────────────────────────────────────────────────────────
const todayKey = () => new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"

function loadFoods(): FoodEntry[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem(`cal_foods_${todayKey()}`);
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
}

function saveFoods(foods: FoodEntry[]) {
    localStorage.setItem(`cal_foods_${todayKey()}`, JSON.stringify(foods));
}

function loadGoal(): number {
    if (typeof window === 'undefined') return 2000;
    return parseInt(localStorage.getItem('cal_goal') || '2000');
}

// ─── Page Content ───────────────────────────────────────────────────
function CalorieTrackerContent() {
    const router = useRouter();

    // State
    const [goal, setGoal] = useState(2000);
    const [goalEditing, setGoalEditing] = useState(false);
    const [goalInput, setGoalInput] = useState('');
    const [foods, setFoods] = useState<FoodEntry[]>([]);

    // Form state
    const [foodName, setFoodName] = useState('');
    const [calories, setCalories] = useState('');
    const [protein, setProtein] = useState('');
    const [carbs, setCarbs] = useState('');
    const [fat, setFat] = useState('');
    const [fiber, setFiber] = useState('');
    const [serving, setServing] = useState('');
    const [lookingUp, setLookingUp] = useState(false);
    const [lookupStatus, setLookupStatus] = useState<{ type: 'idle' | 'success' | 'error'; msg: string }>({ type: 'idle', msg: '' });
    const [autofilled, setAutofilled] = useState(false);

    // Hydrate from localStorage
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setGoal(loadGoal());
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFoods(loadFoods());
    }, []);

    // ─── Derived stats ──────────────────────────────────────────────
    const totCal = foods.reduce((s, f) => s + f.cal, 0);
    const totProt = foods.reduce((s, f) => s + f.prot, 0);
    const totCarb = foods.reduce((s, f) => s + f.carb, 0);
    const totFat = foods.reduce((s, f) => s + f.fat, 0);
    const totFiber = foods.reduce((s, f) => s + f.fiber, 0);
    const remaining = goal - totCal;
    const isOver = remaining < 0;
    const pct = Math.min((totCal / goal) * 100, 100);

    // Macro targets (30% protein, 50% carb, 20% fat by calories)
    const maxProt = goal * 0.30 / 4;
    const maxCarb = goal * 0.50 / 4;
    const maxFat = goal * 0.20 / 9;

    // ─── Goal ────────────────────────────────────────────────────────
    const saveGoal = useCallback(() => {
        const v = parseInt(goalInput);
        if (v && v >= 100) {
            setGoal(v);
            localStorage.setItem('cal_goal', String(v));
        }
        setGoalEditing(false);
    }, [goalInput]);

    // ─── Lookup ──────────────────────────────────────────────────────
    const handleLookup = async () => {
        if (!foodName.trim()) return;
        setLookingUp(true);
        setLookupStatus({ type: 'idle', msg: 'Looking up nutrition data…' });
        setAutofilled(false);
        setServing('');

        const result = await lookupNutrition(foodName);

        if (result.success && result.data) {
            setCalories(String(result.data.calories));
            setProtein(String(result.data.protein_g));
            setCarbs(String(result.data.carbs_g));
            setFat(String(result.data.fat_g));
            setFiber(String(result.data.fiber_g || 0));
            setServing(result.data.serving);
            setAutofilled(true);
            setLookupStatus({ type: 'success', msg: '✓ Macros filled — adjust if needed' });
        } else {
            setLookupStatus({ type: 'error', msg: result.error || 'Could not fetch nutrition data' });
        }
        setLookingUp(false);
    };

    // ─── Add food ────────────────────────────────────────────────────
    const addFood = () => {
        const cal = parseFloat(calories) || 0;
        if (!foodName.trim() || !cal) return;

        const entry: FoodEntry = {
            id: Date.now(),
            name: foodName.trim(),
            cal,
            prot: parseFloat(protein) || 0,
            carb: parseFloat(carbs) || 0,
            fat: parseFloat(fat) || 0,
            fiber: parseFloat(fiber) || 0,
        };
        const next = [...foods, entry];
        setFoods(next);
        saveFoods(next);

        // Reset form
        setFoodName('');
        setCalories('');
        setProtein('');
        setCarbs('');
        setFat('');
        setFiber('');
        setServing('');
        setAutofilled(false);
        setLookupStatus({ type: 'idle', msg: '' });
    };

    // ─── Delete food ─────────────────────────────────────────────────
    const deleteFood = (id: number) => {
        const next = foods.filter(f => f.id !== id);
        setFoods(next);
        saveFoods(next);
    };

    // ─── Date display ────────────────────────────────────────────────
    const dateStr = new Date().toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    });

    // ─── Render ──────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.push('/member/dashboard')}
                            className="p-2 -ml-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                            aria-label="Back"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                        </button>
                        <div>
                            <h1 className="text-lg sm:text-xl font-bold text-gray-900">Calorie Tracker</h1>
                            <p className="text-xs text-gray-500">{dateStr}</p>
                        </div>
                    </div>
                    <span className="text-xs text-gray-400">{GYM_NAME}</span>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-4">

                {/* ── Goal Card ─────────────────────────────────────── */}
                <div className="bg-white rounded-2xl shadow-sm p-5">
                    <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-gray-400 mb-3">Calorie Goal</p>

                    <div className="flex items-center gap-3">
                        <p className="flex-1 text-4xl font-light tracking-tight text-gray-900 font-mono">
                            {goal} <span className="text-sm text-gray-400 font-sans font-normal">kcal / day</span>
                        </p>
                        <button
                            onClick={() => { setGoalEditing(!goalEditing); setGoalInput(String(goal)); }}
                            className="px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors"
                        >
                            Edit
                        </button>
                    </div>

                    {goalEditing && (
                        <div className="flex gap-2 mt-3">
                            <input
                                type="number"
                                value={goalInput}
                                onChange={e => setGoalInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && saveGoal()}
                                className="w-32 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm focus:outline-none focus:border-blue-500 text-gray-900"
                                min={100}
                                max={9999}
                                autoFocus
                            />
                            <button onClick={saveGoal} className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors">
                                Save
                            </button>
                        </div>
                    )}

                    {/* Progress */}
                    <div className="mt-5">
                        <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                            <span>Consumed: <strong className="text-gray-700">{Math.round(totCal)} kcal</strong></span>
                            <span>Goal: {goal} kcal</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ease-out ${isOver ? 'bg-red-500' : 'bg-emerald-500'}`}
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                        <span className={`inline-block mt-2.5 text-xs font-medium px-3 py-1 rounded-full ${isOver
                            ? 'bg-red-50 text-red-600'
                            : 'bg-emerald-50 text-emerald-700'
                            }`}>
                            {isOver ? `${Math.abs(remaining)} kcal over goal` : `${remaining} kcal remaining`}
                        </span>
                    </div>
                </div>

                {/* ── Macros Card ───────────────────────────────────── */}
                <div className="bg-white rounded-2xl shadow-sm p-5">
                    <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-gray-400 mb-3">Macros Today</p>
                    <div className="grid grid-cols-4 gap-2">
                        {[
                            { label: 'Protein', val: totProt, max: maxProt, color: 'bg-blue-500', unit: 'g' },
                            { label: 'Carbs', val: totCarb, max: maxCarb, color: 'bg-amber-500', unit: 'g' },
                            { label: 'Fat', val: totFat, max: maxFat, color: 'bg-orange-500', unit: 'g' },
                            { label: 'Fiber', val: totFiber, max: 30, color: 'bg-green-500', unit: 'g' },
                        ].map(m => (
                            <div key={m.label} className="bg-gray-50 rounded-xl p-3 text-center">
                                <p className="text-[0.6rem] font-semibold uppercase tracking-wider" style={{ color: m.color.replace('bg-', 'var(--color-').replace('-500', '-600)') }}>
                                    <span className={`${m.color.replace('bg-', 'text-').replace('500', '600')}`}>{m.label}</span>
                                </p>
                                <p className="text-lg font-medium font-mono mt-0.5 text-gray-900">{m.val.toFixed(1)}<span className="text-xs text-gray-400">{m.unit}</span></p>
                                <div className="h-1 bg-gray-200 rounded-full mt-1.5 overflow-hidden">
                                    <div className={`h-full rounded-full ${m.color} transition-all duration-500`} style={{ width: `${Math.min(m.val / m.max * 100, 100)}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Add Food Card ─────────────────────────────────── */}
                <div className="bg-white rounded-2xl shadow-sm p-5">
                    <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-gray-400 mb-3">Add Food</p>

                    {/* Food name + lookup */}
                    <div className="mb-3">
                        <label className="block text-[0.6rem] font-semibold uppercase tracking-wider text-gray-400 mb-1">Food Name</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={foodName}
                                onChange={e => setFoodName(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') handleLookup(); }}
                                placeholder="e.g. 2 chapatis, 1 cup dal, 100g paneer…"
                                className="flex-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:bg-white text-gray-900 placeholder:text-gray-400 transition-colors"
                            />
                            <button
                                onClick={handleLookup}
                                disabled={lookingUp || !foodName.trim()}
                                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg text-sm font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                            >
                                {lookingUp ? (
                                    <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <span>🔍 Look up</span>
                                )}
                            </button>
                        </div>
                        {lookupStatus.msg && (
                            <p className={`text-xs mt-1.5 ${lookupStatus.type === 'success' ? 'text-emerald-600' :
                                lookupStatus.type === 'error' ? 'text-red-500' : 'text-gray-400'
                                }`}>
                                {lookupStatus.msg}
                            </p>
                        )}
                    </div>

                    {/* Serving note */}
                    {serving && (
                        <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 mb-3">
                            📏 Serving: {serving}
                        </p>
                    )}

                    {/* Macro inputs */}
                    <div className="grid grid-cols-2 gap-2.5">
                        {[
                            { label: 'Calories (kcal)', value: calories, setter: setCalories },
                            { label: 'Protein (g)', value: protein, setter: setProtein },
                            { label: 'Carbs (g)', value: carbs, setter: setCarbs },
                            { label: 'Fat (g)', value: fat, setter: setFat },
                        ].map(f => (
                            <div key={f.label}>
                                <label className="block text-[0.6rem] font-semibold uppercase tracking-wider text-gray-400 mb-1">{f.label}</label>
                                <input
                                    type="number"
                                    value={f.value}
                                    onChange={e => f.setter(e.target.value)}
                                    placeholder="0"
                                    min={0}
                                    className={`w-full px-3 py-2.5 border rounded-lg font-mono text-sm focus:outline-none text-gray-900 transition-colors ${autofilled
                                        ? 'bg-emerald-50 border-emerald-300 focus:border-emerald-500'
                                        : 'bg-gray-50 border-gray-200 focus:border-emerald-500 focus:bg-white'
                                        }`}
                                />
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={addFood}
                        className="w-full mt-3 py-3 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 active:bg-emerald-800 transition-colors"
                    >
                        Add to Log
                    </button>
                </div>

                {/* ── Food Log Card ─────────────────────────────────── */}
                <div className="bg-white rounded-2xl shadow-sm p-5">
                    <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-gray-400 mb-3">Today&apos;s Log</p>

                    {foods.length === 0 ? (
                        <p className="text-center text-sm text-gray-400 py-6">Nothing logged yet — add a food above.</p>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {foods.map(f => (
                                <div key={f.id} className="flex items-center gap-3 py-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">{f.name}</p>
                                        <p className="text-[0.7rem] text-gray-400 font-mono mt-0.5">
                                            P {f.prot}g · C {f.carb}g · F {f.fat}g
                                        </p>
                                    </div>
                                    <span className="text-xs font-medium font-mono bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md shrink-0">
                                        {f.cal} kcal
                                    </span>
                                    <button
                                        onClick={() => deleteFood(f.id)}
                                        className="text-gray-300 hover:text-red-500 transition-colors text-lg shrink-0"
                                        title="Remove"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </main>
        </div>
    );
}

// ─── Export page with auth guard ────────────────────────────────────
export default function CalorieTrackerPage() {
    return (
        <MemberPhoneGuard>
            <CalorieTrackerContent />
        </MemberPhoneGuard>
    );
}
