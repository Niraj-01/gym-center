'use client';

/**
 * Workout Plan Detail Editor — Add weeks, days, and exercises to a workout plan
 */

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { WorkoutPlan, WorkoutDay, WorkoutExercise, WorkoutExerciseFormData } from '@/lib/types/workout';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

interface DayWithExercises extends WorkoutDay {
    exercises: WorkoutExercise[];
}

function WorkoutPlanEditorContent() {
    const router = useRouter();
    const params = useParams();
    const planId = params.id as string;

    const [plan, setPlan] = useState<WorkoutPlan | null>(null);
    const [days, setDays] = useState<DayWithExercises[]>([]);
    const [loading, setLoading] = useState(true);
    const [addingDay, setAddingDay] = useState(false);
    const [addingExerciseTo, setAddingExerciseTo] = useState<string | null>(null);
    const [expandedDay, setExpandedDay] = useState<string | null>(null);

    // Day form
    const [dayForm, setDayForm] = useState({ week_number: 1, day_number: 1, day_name: '' });
    // Exercise form
    const [exerciseForm, setExerciseForm] = useState<WorkoutExerciseFormData>({
        exercise_name: '', sets: 3, reps: '10', rest_seconds: 60, notes: '',
    });

    useEffect(() => {
        loadPlanData();
    }, [planId]);

    const loadPlanData = async () => {
        try {
            setLoading(true);

            // Load plan
            const { data: planData, error: planError } = await supabase
                .from('workout_plans')
                .select('*')
                .eq('id', planId)
                .single();

            if (planError || !planData) {
                console.error('Plan not found:', planError);
                router.push('/admin/workouts');
                return;
            }

            setPlan({
                id: String(planData.id),
                name: planData.name,
                description: planData.description || '',
                created_by: planData.created_by,
                is_active: planData.is_active,
                created_at: planData.created_at,
                updated_at: planData.updated_at,
            });

            // Load days with exercises
            const { data: daysData, error: daysError } = await supabase
                .from('workout_days')
                .select(`
                    *,
                    workout_exercises(*)
                `)
                .eq('plan_id', planId)
                .order('week_number', { ascending: true })
                .order('day_number', { ascending: true });

            if (daysError) throw daysError;

            const mappedDays: DayWithExercises[] = (daysData || []).map((d: Record<string, unknown>) => ({
                id: String(d.id),
                plan_id: String(d.plan_id),
                week_number: d.week_number as number,
                day_number: d.day_number as number,
                day_name: d.day_name as string,
                notes: (d.notes as string) || '',
                created_at: d.created_at as string,
                exercises: (Array.isArray(d.workout_exercises) ? d.workout_exercises : []).map((ex: Record<string, unknown>) => ({
                    id: String(ex.id),
                    day_id: String(ex.day_id),
                    exercise_name: ex.exercise_name as string,
                    sets: ex.sets as number,
                    reps: ex.reps as string,
                    rest_seconds: ex.rest_seconds as number,
                    notes: (ex.notes as string) || '',
                    order_index: ex.order_index as number,
                    created_at: ex.created_at as string,
                })).sort((a: WorkoutExercise, b: WorkoutExercise) => a.order_index - b.order_index),
            }));

            setDays(mappedDays);

            // Auto-compute next day form values
            if (mappedDays.length > 0) {
                const lastDay = mappedDays[mappedDays.length - 1];
                setDayForm({
                    week_number: lastDay.week_number,
                    day_number: lastDay.day_number + 1,
                    day_name: '',
                });
            }
        } catch (err) {
            console.error('Error loading plan data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddDay = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!dayForm.day_name.trim()) return;

        try {
            setAddingDay(true);
            const { error } = await supabase
                .from('workout_days')
                .insert({
                    plan_id: planId,
                    week_number: dayForm.week_number,
                    day_number: dayForm.day_number,
                    day_name: dayForm.day_name.trim(),
                });

            if (error) throw error;
            setDayForm({ ...dayForm, day_number: dayForm.day_number + 1, day_name: '' });
            await loadPlanData();
        } catch (err) {
            console.error('Error adding day:', err);
        } finally {
            setAddingDay(false);
        }
    };

    const handleAddExercise = async (dayId: string, e: React.FormEvent) => {
        e.preventDefault();
        if (!exerciseForm.exercise_name.trim()) return;

        const dayExercises = days.find(d => d.id === dayId)?.exercises || [];

        try {
            const { error } = await supabase
                .from('workout_exercises')
                .insert({
                    day_id: dayId,
                    exercise_name: exerciseForm.exercise_name.trim(),
                    sets: exerciseForm.sets,
                    reps: exerciseForm.reps,
                    rest_seconds: exerciseForm.rest_seconds,
                    notes: exerciseForm.notes?.trim() || '',
                    order_index: dayExercises.length,
                });

            if (error) throw error;
            setExerciseForm({ exercise_name: '', sets: 3, reps: '10', rest_seconds: 60, notes: '' });
            await loadPlanData();
        } catch (err) {
            console.error('Error adding exercise:', err);
        }
    };

    const handleDeleteDay = async (dayId: string) => {
        if (!confirm('Delete this day and all its exercises?')) return;
        try {
            const { error } = await supabase.from('workout_days').delete().eq('id', dayId);
            if (error) throw error;
            await loadPlanData();
        } catch (err) {
            console.error('Error deleting day:', err);
        }
    };

    const handleDeleteExercise = async (exerciseId: string) => {
        try {
            const { error } = await supabase.from('workout_exercises').delete().eq('id', exerciseId);
            if (error) throw error;
            await loadPlanData();
        } catch (err) {
            console.error('Error deleting exercise:', err);
        }
    };

    // Group days by week
    const weekGroups: Record<number, DayWithExercises[]> = {};
    days.forEach(day => {
        if (!weekGroups[day.week_number]) weekGroups[day.week_number] = [];
        weekGroups[day.week_number].push(day);
    });
    const weekNumbers = Object.keys(weekGroups).map(Number).sort((a, b) => a - b);

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-black mx-auto mb-4"></div>
                        <p className="text-sm text-gray-500">Loading plan...</p>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    if (!plan) return null;

    return (
        <AdminLayout>
            <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => router.push('/admin/workouts')}
                        className="text-sm text-gray-600 hover:text-black transition-colors mb-4 flex items-center gap-1"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Plans
                    </button>
                    <h1 className="text-2xl font-bold text-black">{plan.name}</h1>
                    {plan.description && (
                        <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                        <span>{days.length} training days</span>
                        <span>{weekNumbers.length} week{weekNumbers.length !== 1 ? 's' : ''}</span>
                        <span>{days.reduce((sum, d) => sum + d.exercises.length, 0)} exercises total</span>
                    </div>
                </div>

                {/* Week-by-Week View */}
                {weekNumbers.map(weekNum => (
                    <div key={weekNum} className="mb-8">
                        <h2 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center text-sm font-bold">
                                {weekNum}
                            </span>
                            Week {weekNum}
                        </h2>

                        <div className="space-y-3">
                            {weekGroups[weekNum].map(day => (
                                <div key={day.id} className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                                    {/* Day Header */}
                                    <button
                                        onClick={() => setExpandedDay(expandedDay === day.id ? null : day.id)}
                                        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="w-7 h-7 bg-gray-100 rounded-md flex items-center justify-center text-xs font-semibold text-gray-600">
                                                D{day.day_number}
                                            </span>
                                            <div className="text-left">
                                                <h3 className="text-sm font-semibold text-black">{day.day_name}</h3>
                                                <p className="text-xs text-gray-500">{day.exercises.length} exercise{day.exercises.length !== 1 ? 's' : ''}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteDay(day.id); }}
                                                className="p-1.5 text-gray-400 hover:text-red-500 rounded transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                            <svg className={`w-5 h-5 text-gray-400 transition-transform ${expandedDay === day.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </button>

                                    {/* Exercises List (collapsed/expanded) */}
                                    {expandedDay === day.id && (
                                        <div className="border-t border-gray-200">
                                            {day.exercises.length > 0 && (
                                                <div className="divide-y divide-gray-100">
                                                    {day.exercises.map((ex, idx) => (
                                                        <div key={ex.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
                                                            <div className="flex items-center gap-3">
                                                                <span className="w-6 h-6 bg-gray-100 rounded text-xs font-medium text-gray-500 flex items-center justify-center">
                                                                    {idx + 1}
                                                                </span>
                                                                <div>
                                                                    <p className="text-sm font-medium text-black">{ex.exercise_name}</p>
                                                                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                                                                        <span>{ex.sets} sets</span>
                                                                        <span>×</span>
                                                                        <span>{ex.reps} reps</span>
                                                                        <span>•</span>
                                                                        <span>{ex.rest_seconds}s rest</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => handleDeleteExercise(ex.id)}
                                                                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Add Exercise Form */}
                                            {addingExerciseTo === day.id ? (
                                                <form onSubmit={(e) => handleAddExercise(day.id, e)} className="p-5 bg-gray-50 border-t border-gray-200">
                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                                                        <div className="col-span-2">
                                                            <input
                                                                type="text"
                                                                value={exerciseForm.exercise_name}
                                                                onChange={(e) => setExerciseForm({ ...exerciseForm, exercise_name: e.target.value })}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-black focus:outline-none focus:border-black"
                                                                placeholder="Exercise name"
                                                                required
                                                                autoFocus
                                                            />
                                                        </div>
                                                        <input
                                                            type="number"
                                                            value={exerciseForm.sets}
                                                            onChange={(e) => setExerciseForm({ ...exerciseForm, sets: parseInt(e.target.value) || 0 })}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-black focus:outline-none focus:border-black"
                                                            placeholder="Sets"
                                                            min={1}
                                                        />
                                                        <input
                                                            type="text"
                                                            value={exerciseForm.reps}
                                                            onChange={(e) => setExerciseForm({ ...exerciseForm, reps: e.target.value })}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-black focus:outline-none focus:border-black"
                                                            placeholder="Reps (e.g. 8-12)"
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                                        <input
                                                            type="number"
                                                            value={exerciseForm.rest_seconds}
                                                            onChange={(e) => setExerciseForm({ ...exerciseForm, rest_seconds: parseInt(e.target.value) || 0 })}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-black focus:outline-none focus:border-black"
                                                            placeholder="Rest (seconds)"
                                                            min={0}
                                                        />
                                                        <input
                                                            type="text"
                                                            value={exerciseForm.notes || ''}
                                                            onChange={(e) => setExerciseForm({ ...exerciseForm, notes: e.target.value })}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-black focus:outline-none focus:border-black"
                                                            placeholder="Notes (optional)"
                                                        />
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button type="submit" className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800">
                                                            Add Exercise
                                                        </button>
                                                        <button type="button" onClick={() => setAddingExerciseTo(null)} className="px-4 py-2 text-sm text-gray-600 hover:text-black">
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </form>
                                            ) : (
                                                <button
                                                    onClick={() => { setAddingExerciseTo(day.id); setExerciseForm({ exercise_name: '', sets: 3, reps: '10', rest_seconds: 60, notes: '' }); }}
                                                    className="w-full px-5 py-3 text-sm text-gray-500 hover:text-black hover:bg-gray-50 transition-colors flex items-center gap-2 border-t border-gray-200"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                    </svg>
                                                    Add Exercise
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {/* Add Day Form */}
                <div className="border border-dashed border-gray-300 rounded-xl p-5 mt-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Add Training Day</h3>
                    <form onSubmit={handleAddDay} className="flex flex-wrap gap-3 items-end">
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Week</label>
                            <input
                                type="number"
                                value={dayForm.week_number}
                                onChange={(e) => setDayForm({ ...dayForm, week_number: parseInt(e.target.value) || 1 })}
                                className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm text-black focus:outline-none focus:border-black"
                                min={1}
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Day #</label>
                            <input
                                type="number"
                                value={dayForm.day_number}
                                onChange={(e) => setDayForm({ ...dayForm, day_number: parseInt(e.target.value) || 1 })}
                                className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm text-black focus:outline-none focus:border-black"
                                min={1}
                            />
                        </div>
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-xs text-gray-500 mb-1">Day Name</label>
                            <input
                                type="text"
                                value={dayForm.day_name}
                                onChange={(e) => setDayForm({ ...dayForm, day_name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-black focus:outline-none focus:border-black"
                                placeholder="e.g. Push Day, Chest & Triceps"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={addingDay}
                            className="px-5 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
                        >
                            {addingDay ? 'Adding...' : 'Add Day'}
                        </button>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
}

export default function WorkoutPlanEditorPage() {
    return (
        <AuthGuard>
            <WorkoutPlanEditorContent />
        </AuthGuard>
    );
}
