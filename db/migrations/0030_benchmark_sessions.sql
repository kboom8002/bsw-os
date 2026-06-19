-- Migration 0030: benchmark_sessions

CREATE TABLE IF NOT EXISTS public.benchmark_sessions (
    session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    domain_slug TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'running', -- 'running', 'paused', 'completed', 'error'
    total_queries INTEGER NOT NULL DEFAULT 0,
    completed_queries INTEGER NOT NULL DEFAULT 0,
    saved_state JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_benchmark_sessions_workspace_id ON public.benchmark_sessions(workspace_id);
