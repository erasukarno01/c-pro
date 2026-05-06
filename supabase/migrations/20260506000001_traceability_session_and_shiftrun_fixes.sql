-- =============================================================================
-- Traceability fixes:
-- 1) Separate autonomous first/last check results by check_session
-- 2) Ensure shift_runs has leader_user_id/group_id/plan_start_at/plan_finish_at
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Autonomous check session separation
-- ---------------------------------------------------------------------------
ALTER TABLE public.autonomous_check_results
  ADD COLUMN IF NOT EXISTS check_session TEXT NOT NULL DEFAULT 'first'
    CHECK (check_session IN ('first', 'last'));

-- Rebuild uniqueness to include session so first/last are not overwritten.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'autonomous_check_results_shift_run_id_check_item_id_checked_by_operator_id_key'
  ) THEN
    ALTER TABLE public.autonomous_check_results
      DROP CONSTRAINT autonomous_check_results_shift_run_id_check_item_id_checked_by_operator_id_key;
  END IF;
END $$;

ALTER TABLE public.autonomous_check_results
  ADD CONSTRAINT autonomous_results_unique_per_session
  UNIQUE (shift_run_id, check_item_id, checked_by_operator_id, check_session);

CREATE INDEX IF NOT EXISTS idx_autonomous_results_shift_session
  ON public.autonomous_check_results (shift_run_id, check_session);

-- ---------------------------------------------------------------------------
-- 2. Shift run fields needed by current app flow
-- ---------------------------------------------------------------------------
ALTER TABLE public.shift_runs
  ADD COLUMN IF NOT EXISTS leader_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS plan_start_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS plan_finish_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_shift_runs_group_id ON public.shift_runs(group_id);
CREATE INDEX IF NOT EXISTS idx_shift_runs_leader_user_id ON public.shift_runs(leader_user_id);

COMMIT;
