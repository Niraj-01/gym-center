-- ============================================================================
-- Workout Management Tables
-- ============================================================================

-- 1. Workout Plans — Created by admin/trainer
CREATE TABLE IF NOT EXISTS workout_plans (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT DEFAULT '',
    created_by VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Workout Days — Each day within a plan (week/day structure)
CREATE TABLE IF NOT EXISTS workout_days (
    id BIGSERIAL PRIMARY KEY,
    plan_id BIGINT NOT NULL REFERENCES workout_plans(id) ON DELETE CASCADE,
    week_number INT NOT NULL DEFAULT 1,
    day_number INT NOT NULL DEFAULT 1,
    day_name VARCHAR(50) NOT NULL DEFAULT 'Day 1',
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(plan_id, week_number, day_number)
);

-- 3. Workout Exercises — Exercises for each day
CREATE TABLE IF NOT EXISTS workout_exercises (
    id BIGSERIAL PRIMARY KEY,
    day_id BIGINT NOT NULL REFERENCES workout_days(id) ON DELETE CASCADE,
    exercise_name VARCHAR(100) NOT NULL,
    sets INT NOT NULL DEFAULT 3,
    reps VARCHAR(20) NOT NULL DEFAULT '10',
    rest_seconds INT NOT NULL DEFAULT 60,
    notes TEXT DEFAULT '',
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Member Workout Access — Admin-controlled access toggle
CREATE TABLE IF NOT EXISTS member_workout_access (
    id BIGSERIAL PRIMARY KEY,
    member_id BIGINT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    plan_id BIGINT NOT NULL REFERENCES workout_plans(id) ON DELETE CASCADE,
    has_access BOOLEAN DEFAULT true,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_by VARCHAR(100) NOT NULL,
    UNIQUE(member_id)
);

-- 5. Workout Logs — Member's daily workout tracking
CREATE TABLE IF NOT EXISTS workout_logs (
    id BIGSERIAL PRIMARY KEY,
    member_id BIGINT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    exercise_id BIGINT NOT NULL REFERENCES workout_exercises(id) ON DELETE CASCADE,
    day_id BIGINT NOT NULL REFERENCES workout_days(id) ON DELETE CASCADE,
    sets_completed INT NOT NULL DEFAULT 0,
    reps_completed VARCHAR(50) DEFAULT '',
    weight_used DECIMAL(10,2),
    notes TEXT DEFAULT '',
    logged_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_workout_days_plan ON workout_days(plan_id);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_day ON workout_exercises(day_id);
CREATE INDEX IF NOT EXISTS idx_member_workout_access_member ON member_workout_access(member_id);
CREATE INDEX IF NOT EXISTS idx_member_workout_access_plan ON member_workout_access(plan_id);
CREATE INDEX IF NOT EXISTS idx_workout_logs_member ON workout_logs(member_id);
CREATE INDEX IF NOT EXISTS idx_workout_logs_day ON workout_logs(day_id, member_id);

-- Enable RLS
ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_workout_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow all for authenticated users / anon key for now)
CREATE POLICY "Allow all on workout_plans" ON workout_plans FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on workout_days" ON workout_days FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on workout_exercises" ON workout_exercises FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on member_workout_access" ON member_workout_access FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on workout_logs" ON workout_logs FOR ALL USING (true) WITH CHECK (true);
