import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { minutesBetweenIso } from '@/lib/time/minutesBetweenIso';

// Allow "plug-in" future job types while preserving autocomplete for core ones.
export type JobType = 'task' | 'shipment' | 'stocktake' | (string & {});

export interface JobTimeIntervalRow {
  id: string;
  tenant_id: string;
  job_type: JobType;
  job_id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  ended_reason: string | null;
  created_at: string;
}

export interface TimerStartResult {
  ok: boolean;
  already_active?: boolean;
  started_interval_id?: string | null;
  paused_interval_id?: string | null;
  paused_job_type?: string | null;
  paused_job_id?: string | null;
  error_code?: string | null;
  error_message?: string | null;
  active_interval_id?: string | null;
  active_job_type?: string | null;
  active_job_id?: string | null;
}

export function useJobTimer(jobType: JobType, jobId: string | undefined) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [intervals, setIntervals] = useState<JobTimeIntervalRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Local clock ticker so "active" timers update smoothly
  const [nowTick, setNowTick] = useState<number>(() => Date.now());
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchIntervals = useCallback(async () => {
    if (!profile?.tenant_id || !jobId) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await (supabase
        .from('job_time_intervals') as any)
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .eq('job_type', jobType)
        .eq('job_id', jobId)
        .order('started_at', { ascending: true });

      if (fetchError) throw fetchError;
      setIntervals((data || []) as JobTimeIntervalRow[]);
    } catch (err: any) {
      console.error('[useJobTimer] fetchIntervals error:', err);
      setError(err?.message || 'Failed to load timer intervals');
    } finally {
      setLoading(false);
    }
  }, [profile?.tenant_id, jobId, jobType]);

  useEffect(() => {
    fetchIntervals();
  }, [fetchIntervals]);

  const activeIntervals = useMemo(
    () => intervals.filter(i => !i.ended_at),
    [intervals],
  );

  const isActive = activeIntervals.length > 0;

  const myActiveInterval = useMemo(() => {
    if (!profile?.id) return null;
    return activeIntervals.find(i => i.user_id === profile.id) || null;
  }, [activeIntervals, profile?.id]);

  const isActiveForMe = !!myActiveInterval;

  // Start ticker only when any interval is active
  useEffect(() => {
    if (!isActive) {
      if (tickerRef.current) clearInterval(tickerRef.current);
      tickerRef.current = null;
      return;
    }
    if (tickerRef.current) return;

    tickerRef.current = setInterval(() => setNowTick(Date.now()), 1000);
    return () => {
      if (tickerRef.current) clearInterval(tickerRef.current);
      tickerRef.current = null;
    };
  }, [isActive]);

  const laborMinutes = useMemo(() => {
    if (intervals.length === 0) return 0;
    const nowIso = new Date(nowTick).toISOString();
    const total = intervals.reduce((sum, i) => {
      const end = i.ended_at || nowIso;
      return sum + minutesBetweenIso(i.started_at, end);
    }, 0);
    return Math.round(total);
  }, [intervals, nowTick]);

  // For phase 1 (single-user default), cycle minutes == labor minutes.
  // We'll compute the true cycle time later (union of active ranges).
  const cycleMinutes = laborMinutes;

  const startOrResume = useCallback(async (options?: { pauseExisting?: boolean }): Promise<TimerStartResult> => {
    if (!jobId) return { ok: false, error_code: 'MISSING_JOB_ID', error_message: 'Missing job id' };
    try {
      const { data, error: rpcError } = await supabase.rpc('rpc_timer_start_job', {
        p_job_type: jobType,
        p_job_id: jobId,
        p_pause_existing: options?.pauseExisting ?? false,
      });
      if (rpcError) throw rpcError;

      const result = (data || {}) as TimerStartResult;
      if (result.ok) {
        await fetchIntervals();
      }
      return result;
    } catch (err: any) {
      console.error('[useJobTimer] startOrResume error:', err);
      return { ok: false, error_code: 'RPC_ERROR', error_message: err?.message || 'Failed to start timer' };
    }
  }, [jobId, jobType, fetchIntervals]);

  const end = useCallback(async (reason: 'pause' | 'complete' | 'auto_pause' | string = 'pause') => {
    if (!jobId) return { ok: false, error_code: 'MISSING_JOB_ID', error_message: 'Missing job id' } as TimerStartResult;
    try {
      const { data, error: rpcError } = await supabase.rpc('rpc_timer_end_job', {
        p_job_type: jobType,
        p_job_id: jobId,
        p_reason: reason,
      });
      if (rpcError) throw rpcError;
      const result = (data || {}) as TimerStartResult;
      if (result.ok) {
        await fetchIntervals();
      }
      return result;
    } catch (err: any) {
      console.error('[useJobTimer] end error:', err);
      return { ok: false, error_code: 'RPC_ERROR', error_message: err?.message || 'Failed to end timer' };
    }
  }, [jobId, jobType, fetchIntervals]);

  const pause = useCallback(async () => end('pause'), [end]);
  const complete = useCallback(async () => end('complete'), [end]);

  // "Paused" means: job is in progress but this user has no active interval.
  // (We don't yet store an explicit paused state at job level.)
  const isPausedForMe = useMemo(() => {
    if (!profile?.id) return false;
    const hasAny = intervals.some(i => i.user_id === profile.id);
    return hasAny && !isActiveForMe;
  }, [intervals, profile?.id, isActiveForMe]);

  return {
    loading,
    error,
    intervals,
    refetch: fetchIntervals,

    isActive,
    activeIntervals,
    laborMinutes,
    cycleMinutes,

    isActiveForMe,
    isPausedForMe,
    myActiveInterval,

    startOrResume,
    pause,
    complete,
    end,
  };
}

