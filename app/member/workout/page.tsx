'use client';

/**
 * Member Workout Portal — View assigned workout plan and log daily progress
 * Only members with workout access (has_access = true) can view their plan
 */

import { useState, useEffect } from 'react';
import { MemberPhoneGuard } from '@/components/auth/MemberPhoneGuard';
import { useMemberAuth } from '@/contexts/MemberAuthContext';
import { WorkoutPlan, WorkoutDay, WorkoutExercise, WorkoutLog } from '@/lib/types/workout';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

interface DayWithExercises extends WorkoutDay {
    exercises: WorkoutExercise[];
}

function MemberWorkoutContent() {
    const { memberSession } = useMemberAuth();
    const [plan, setPlan] = useState<WorkoutPlan | null>(null);
    const [days, setDays] = useState<DayWithExercises[]>([]);
    const [logs, setLogs] = useState<WorkoutLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [accessDenied, setAccessDenied] = useState(false);
    const [selectedDay, setSelectedDay] = useState<string | null>(null);
    const [loggingExercise, setLoggingExercise] = useState<string | null>(null);
    const [logForm, setLogForm] = useState({ sets_completed: 0, reps_completed: '', weight_used: '', notes: '' });

    useEffect(() => {
        if (memberSession?.memberId) {
            loadWorkout();
        }
    }, [memberSession?.memberId]);

    const loadWorkout = async () => {
        if (!memberSession?.memberId) return;

        try {
            setLoading(true);

            // Check member workout access
            const { data: accessData, error: accessError } = await supabase
                .from('member_workout_access')
                .select('*')
                .eq('member_id', memberSession.memberId)
                .maybeSingle();

            if (accessError) throw accessError;

            if (!accessData || !accessData.has_access) {
                setAccessDenied(true);
                setLoading(false);
                return;
            }

            // Load assigned plan
            const { data: planData } = await supabase
                .from('workout_plans')
                .select('*')
                .eq('id', accessData.plan_id)
                .single();

            if (!planData) {
                setAccessDenied(true);
                setLoading(false);
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
            const { data: daysData } = await supabase
                .from('workout_days')
                .select(`
                    *,
                    workout_exercises(*)
                `)
                .eq('plan_id', accessData.plan_id)
                .order('week_number', { ascending: true })
                .order('day_number', { ascending: true });

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

            // Load today's workout logs
            const today = new Date().toISOString().split('T')[0];
            const { data: logsData } = await supabase
                .from('workout_logs')
                .select('*')
                .eq('member_id', memberSession.memberId)
                .gte('logged_at', today + 'T00:00:00')
                .lte('logged_at', today + 'T23:59:59');

            const mappedLogs: WorkoutLog[] = (logsData || []).map((l: Record<string, unknown>) => ({
                id: String(l.id),
                member_id: String(l.member_id),
                exercise_id: String(l.exercise_id),
                day_id: String(l.day_id),
                sets_completed: l.sets_completed as number,
                reps_completed: l.reps_completed as string,
                weight_used: l.weight_used as number | undefined,
                notes: (l.notes as string) || '',
                logged_at: l.logged_at as string,
            }));

            setLogs(mappedLogs);

            // Auto-select first day
            if (mappedDays.length > 0) {
                setSelectedDay(mappedDays[0].id);
            }
        } catch (err) {
            console.error('Error loading workout:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogExercise = async (exerciseId: string, dayId: string) => {
        if (!memberSession?.memberId) return;

        try {
            const { error } = await supabase
                .from('workout_logs')
                .insert({
                    member_id: memberSession.memberId,
                    exercise_id: exerciseId,
                    day_id: dayId,
                    sets_completed: logForm.sets_completed,
                    reps_completed: logForm.reps_completed,
                    weight_used: logForm.weight_used ? parseFloat(logForm.weight_used) : null,
                    notes: logForm.notes.trim(),
                });

            if (error) throw error;

            setLoggingExercise(null);
            setLogForm({ sets_completed: 0, reps_completed: '', weight_used: '', notes: '' });
            await loadWorkout();
        } catch (err) {
            console.error('Error logging exercise:', err);
        }
    };

    const isExerciseLogged = (exerciseId: string) => {
        return logs.some(l => l.exercise_id === exerciseId);
    };

    const getExerciseLog = (exerciseId: string) => {
        return logs.find(l => l.exercise_id === exerciseId);
    };

    // Group days by week
    const weekGroups: Record<number, DayWithExercises[]> = {};
    days.forEach(day => {
        if (!weekGroups[day.week_number]) weekGroups[day.week_number] = [];
        weekGroups[day.week_number].push(day);
    });
    const weekNumbers = Object.keys(weekGroups).map(Number).sort((a, b) => a - b);

    const currentDay = days.find(d => d.id === selectedDay);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-white">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-black mx-auto mb-4"></div>
                    <p className="text-sm text-gray-500">Loading your workout plan...</p>
                </div>
            </div>
        );
    }

    // Access Denied State
    if (accessDenied) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-white">
                <div className="text-center max-w-md px-6">
                    <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-black mb-2">Workout Plan Locked</h2>
                    <p className="text-sm text-gray-500 mb-6">
                        Your workout plan access has not been enabled yet. Please contact your gym trainer or admin to get access to your workout plan.
                    </p>
                    <div className="p-4 bg-gray-50 rounded-xl text-sm text-gray-600">
                        💡 Ask your trainer to enable your workout access from the admin portal.
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-3xl mx-auto px-4 py-4">
                    <h1 className="text-lg font-bold text-black">{plan?.name || 'My Workout'}</h1>
                    {plan?.description && (
                        <p className="text-xs text-gray-500 mt-0.5">{plan.description}</p>
                    )}
                </div>
            </header>

            <div className="max-w-3xl mx-auto px-4 py-6">
                {/* Day Selector Tabs */}
                <div className="mb-6 overflow-x-auto">
                    <div className="flex gap-2 pb-2">
                        {weekNumbers.map(weekNum =>
                            weekGroups[weekNum].map(day => (
                                <button
                                    key={day.id}
                                    onClick={() => setSelectedDay(day.id)}
                                    className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${selectedDay === day.id
                                        ? 'bg-black text-white shadow-md'
                                        : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-400'
                                        }`}
                                >
                                    <span className="text-xs opacity-60">W{day.week_number}</span>
                                    <span className="ml-1">{day.day_name}</span>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Selected Day Exercises */}
                {currentDay && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-semibold text-black">{currentDay.day_name}</h2>
                            <span className="text-xs text-gray-500">
                                {currentDay.exercises.filter(ex => isExerciseLogged(ex.id)).length}/{currentDay.exercises.length} done today
                            </span>
                        </div>

                        {currentDay.exercises.map((exercise, idx) => {
                            const logged = isExerciseLogged(exercise.id);
                            const logData = getExerciseLog(exercise.id);

                            return (
                                <div
                                    key={exercise.id}
                                    className={`bg-white border rounded-xl p-4 transition-all ${logged
                                        ? 'border-green-200 bg-green-50/50'
                                        : 'border-gray-200'
                                        }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3">
                                            <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${logged
                                                ? 'bg-green-500 text-white'
                                                : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                {logged ? '✓' : idx + 1}
                                            </span>
                                            <div>
                                                <h3 className={`text-sm font-semibold ${logged ? 'text-green-700' : 'text-black'}`}>
                                                    {exercise.exercise_name}
                                                </h3>
                                                <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                                    <span className="bg-gray-100 px-2 py-0.5 rounded">{exercise.sets} sets</span>
                                                    <span className="bg-gray-100 px-2 py-0.5 rounded">{exercise.reps} reps</span>
                                                    <span className="bg-gray-100 px-2 py-0.5 rounded">{exercise.rest_seconds}s rest</span>
                                                </div>
                                                {exercise.notes && (
                                                    <p className="text-xs text-gray-400 mt-1.5 italic">{exercise.notes}</p>
                                                )}
                                            </div>
                                        </div>

                                        {!logged && (
                                            <button
                                                onClick={() => {
                                                    setLoggingExercise(exercise.id);
                                                    setLogForm({
                                                        sets_completed: exercise.sets,
                                                        reps_completed: exercise.reps,
                                                        weight_used: '',
                                                        notes: '',
                                                    });
                                                }}
                                                className="px-3 py-1.5 bg-black text-white rounded-lg text-xs font-medium hover:bg-gray-800 transition-colors"
                                            >
                                                Log
                                            </button>
                                        )}
                                    </div>

                                    {/* Log Summary */}
                                    {logged && logData && (
                                        <div className="mt-3 pt-3 border-t border-green-200 flex items-center gap-4 text-xs text-green-700">
                                            <span>✓ {logData.sets_completed} sets × {logData.reps_completed} reps</span>
                                            {logData.weight_used && <span>@ {logData.weight_used}kg</span>}
                                            {logData.notes && <span className="italic">{logData.notes}</span>}
                                        </div>
                                    )}

                                    {/* Log Form */}
                                    {loggingExercise === exercise.id && !logged && (
                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                                                <div>
                                                    <label className="text-xs text-gray-500 block mb-1">Sets</label>
                                                    <input
                                                        type="number"
                                                        value={logForm.sets_completed}
                                                        onChange={(e) => setLogForm({ ...logForm, sets_completed: parseInt(e.target.value) || 0 })}
                                                        className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-black"
                                                        min={0}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-gray-500 block mb-1">Reps</label>
                                                    <input
                                                        type="text"
                                                        value={logForm.reps_completed}
                                                        onChange={(e) => setLogForm({ ...logForm, reps_completed: e.target.value })}
                                                        className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-black"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-gray-500 block mb-1">Weight (kg)</label>
                                                    <input
                                                        type="number"
                                                        value={logForm.weight_used}
                                                        onChange={(e) => setLogForm({ ...logForm, weight_used: e.target.value })}
                                                        className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-black"
                                                        placeholder="—"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-gray-500 block mb-1">Notes</label>
                                                    <input
                                                        type="text"
                                                        value={logForm.notes}
                                                        onChange={(e) => setLogForm({ ...logForm, notes: e.target.value })}
                                                        className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-black"
                                                        placeholder="—"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleLogExercise(exercise.id, currentDay.id)}
                                                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700"
                                                >
                                                    ✓ Complete
                                                </button>
                                                <button
                                                    onClick={() => setLoggingExercise(null)}
                                                    className="px-4 py-2 text-xs text-gray-600 hover:text-black"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {/* All Done State */}
                        {currentDay.exercises.length > 0 && currentDay.exercises.every(ex => isExerciseLogged(ex.id)) && (
                            <div className="text-center py-8 bg-white border border-green-200 rounded-xl mt-4">
                                <div className="text-4xl mb-3">🎉</div>
                                <h3 className="text-lg font-bold text-green-700">Workout Complete!</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Great job completing all exercises for {currentDay.day_name}
                                </p>
                            </div>
                        )}

                        {currentDay.exercises.length === 0 && (
                            <div className="text-center py-12 bg-white border border-gray-200 rounded-xl">
                                <p className="text-sm text-gray-500">No exercises added for this day yet.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function MemberWorkoutPage() {
    return (
        <MemberPhoneGuard>
            <MemberWorkoutContent />
        </MemberPhoneGuard>
    );
}
