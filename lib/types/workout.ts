/**
 * Workout Types — Used across admin workout builder, member portal, and access control
 */

export interface WorkoutPlan {
    id: string;
    name: string;
    description: string;
    created_by: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    // Computed
    week_count?: number;
    day_count?: number;
}

export interface WorkoutDay {
    id: string;
    plan_id: string;
    week_number: number;
    day_number: number;
    day_name: string; // e.g. "Monday", "Push Day", etc.
    notes?: string;
    created_at: string;
}

export interface WorkoutExercise {
    id: string;
    day_id: string;
    exercise_name: string;
    sets: number;
    reps: string; // e.g. "8-12" or "15"
    rest_seconds: number;
    notes?: string;
    order_index: number;
    created_at: string;
}

export interface MemberWorkoutAccess {
    id: string;
    member_id: string;
    plan_id: string;
    has_access: boolean;
    assigned_at: string;
    assigned_by: string;
    // Joined fields
    member_name?: string;
    member_phone?: string;
    plan_name?: string;
}

export interface WorkoutLog {
    id: string;
    member_id: string;
    exercise_id: string;
    day_id: string;
    sets_completed: number;
    reps_completed: string;
    weight_used?: number;
    notes?: string;
    logged_at: string;
    // Joined
    exercise_name?: string;
}

// Form types
export interface WorkoutPlanFormData {
    name: string;
    description: string;
}

export interface WorkoutDayFormData {
    week_number: number;
    day_number: number;
    day_name: string;
    notes?: string;
}

export interface WorkoutExerciseFormData {
    exercise_name: string;
    sets: number;
    reps: string;
    rest_seconds: number;
    notes?: string;
}
