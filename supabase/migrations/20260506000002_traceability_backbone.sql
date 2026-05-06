-- =============================================================================
-- Traceability backbone
-- - Run-time operator/workstation snapshot
-- - Generic check sessions/results for autonomous + 5first + 5last
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1) Runtime snapshot for manpower vs skill matrix
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.run_operator_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_run_id UUID NOT NULL REFERENCES public.shift_runs(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
  process_id UUID REFERENCES public.processes(id) ON DELETE SET NULL,
  workstation_id UUID REFERENCES public.workstations(id) ON DELETE SET NULL,
  planned_operator_id UUID REFERENCES public.operators(id) ON DELETE SET NULL,
  actual_operator_id UUID REFERENCES public.operators(id) ON DELETE SET NULL,
  is_absent BOOLEAN NOT NULL DEFAULT false,
  replacement_operator_id UUID REFERENCES public.operators(id) ON DELETE SET NULL,
  required_skill_id UUID REFERENCES public.skills(id) ON DELETE SET NULL,
  required_skill_level INT,
  actual_skill_level INT,
  wi_pass BOOLEAN,
  assignment_status TEXT NOT NULL DEFAULT 'planned' CHECK (assignment_status IN ('planned', 'confirmed', 'replaced', 'blocked')),
  created_by_user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (shift_run_id, process_id, planned_operator_id)
);

CREATE INDEX IF NOT EXISTS idx_roa_shift_run ON public.run_operator_assignments(shift_run_id);
CREATE INDEX IF NOT EXISTS idx_roa_process ON public.run_operator_assignments(process_id);
CREATE INDEX IF NOT EXISTS idx_roa_workstation ON public.run_operator_assignments(workstation_id);

ALTER TABLE public.run_operator_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS run_operator_assignments_read ON public.run_operator_assignments;
CREATE POLICY run_operator_assignments_read ON public.run_operator_assignments
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS run_operator_assignments_write ON public.run_operator_assignments;
CREATE POLICY run_operator_assignments_write ON public.run_operator_assignments
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'leader')
    OR public.has_role(auth.uid(), 'operator')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'leader')
    OR public.has_role(auth.uid(), 'operator')
  );

-- ---------------------------------------------------------------------------
-- 2) Generic check sessions and results
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.check_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_run_id UUID NOT NULL REFERENCES public.shift_runs(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('autonomous', 'fivefirst', 'fivelast')),
  session TEXT NOT NULL DEFAULT 'first' CHECK (session IN ('first', 'last')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'submitted', 'approved')),
  created_by_operator_id UUID REFERENCES public.operators(id),
  created_by_user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (shift_run_id, kind, session)
);

CREATE TABLE IF NOT EXISTS public.check_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_session_id UUID NOT NULL REFERENCES public.check_sessions(id) ON DELETE CASCADE,
  source_item_type TEXT NOT NULL CHECK (source_item_type IN ('autonomous_item', 'fivef5l_item')),
  source_item_id UUID NOT NULL,
  result_status TEXT NOT NULL CHECK (result_status IN ('pending', 'pass', 'fail', 'na')),
  measured_value NUMERIC(18,4),
  note TEXT,
  photo_urls TEXT[],
  checked_by_operator_id UUID REFERENCES public.operators(id),
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (check_session_id, source_item_type, source_item_id, checked_by_operator_id)
);

CREATE INDEX IF NOT EXISTS idx_check_sessions_run ON public.check_sessions(shift_run_id);
CREATE INDEX IF NOT EXISTS idx_check_results_session ON public.check_results(check_session_id);

ALTER TABLE public.check_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS check_sessions_read ON public.check_sessions;
CREATE POLICY check_sessions_read ON public.check_sessions
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS check_sessions_write ON public.check_sessions;
CREATE POLICY check_sessions_write ON public.check_sessions
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'leader')
    OR public.has_role(auth.uid(), 'operator')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'leader')
    OR public.has_role(auth.uid(), 'operator')
  );

DROP POLICY IF EXISTS check_results_read ON public.check_results;
CREATE POLICY check_results_read ON public.check_results
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS check_results_write ON public.check_results;
CREATE POLICY check_results_write ON public.check_results
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'leader')
    OR public.has_role(auth.uid(), 'operator')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'leader')
    OR public.has_role(auth.uid(), 'operator')
  );

COMMIT;
